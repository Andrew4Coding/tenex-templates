#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { execa } from 'execa';
import { parse as parseYaml } from 'yaml';

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(chalk.red('\nOperation cancelled by user.'));
  process.exit(130);
});

const program = new Command();

program
  .name('tenex-templates')
  .description('CLI to initialize framework projects from templates')
  .version('1.0.0')
  .argument('[framework]', 'Framework to use')
  .action(async (framework) => {
    try {
      // If framework is not specified, prompt the user to select one
      let selectedFramework = framework;
      if (!selectedFramework) {
        const templatesDir = path.resolve(__dirname, '../templates');
        const frameworks = (await fs.readdir(templatesDir, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name);
        if (frameworks.length === 0) {
          console.error(chalk.red('No frameworks found in templates directory.'));
          process.exit(1);
        }
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'framework',
            message: 'Select a framework to initialize:',
            choices: frameworks,
          },
        ]);
        selectedFramework = answer.framework;
      }
      // Prompt for project name
      const { projectName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Enter your project name:',
          validate: (input) => input.trim() !== '' || 'Project name cannot be empty',
        },
      ]);
      const templatesDir = path.resolve(__dirname, '../templates');
      const frameworkDir = path.join(templatesDir, selectedFramework);
      const templateYaml = path.join(frameworkDir, 'template.yaml');
      if (!fs.existsSync(templateYaml)) {
        console.error(chalk.red(`Template for framework '${selectedFramework}' not found.`));
        process.exit(1);
      }
      // Parse YAML and execute steps
      const yamlContent = await fs.readFile(templateYaml, 'utf8');
      const template = parseYaml(yamlContent);
      if (!template.steps || !Array.isArray(template.steps)) {
        console.error(chalk.red('No steps found in template.yaml.'));
        process.exit(1);
      }
      // Use project name as destination directory
      const destDir = path.resolve(process.cwd(), projectName);
      await fs.ensureDir(destDir);
      for (const step of template.steps) {
        console.log(chalk.blue(`Step: ${step.name}`));
        console.log(chalk.gray(step.description));
        if (!step.run) continue;
        // Special handling for copy_template_files marker
        if (step.run.trim() === 'copy_template_files') {
          const sampleDir = path.join(frameworkDir, 'sample');
          const spinner = ora(`Copying template files to ${destDir}`).start();
          try {
            // Recursively copy and replace [[project_name]] in files and filenames
            const copyAndReplace = async (src: string, dest: string) => {
              const entries = await fs.readdir(src, { withFileTypes: true });
              for (const entry of entries) {
                let srcPath = path.join(src, entry.name);
                let destName = entry.name.replace(/\[\[project_name\]\]/g, projectName);
                let destPath = path.join(dest, destName);
                if (entry.isDirectory()) {
                  await fs.ensureDir(destPath);
                  await copyAndReplace(srcPath, destPath);
                } else {
                  let content = await fs.readFile(srcPath, 'utf8');
                  content = content.replace(/\[\[project_name\]\]/g, projectName);
                  await fs.writeFile(destPath, content, 'utf8');
                }
              }
            };
            await copyAndReplace(sampleDir, destDir);
            spinner.succeed('Template files copied.');
          } catch (err) {
            spinner.fail('Failed to copy template files.');
            console.error(chalk.red(err));
            process.exit(1);
          }
          continue;
        }
        let runScript = step.run;
        // Generalized prompt system
        let promptVars: Record<string, string | boolean> = { project_name: projectName };
        if (Array.isArray(step.prompts)) {
          const questions = step.prompts.map((prompt: any) => {
            return {
              type: prompt.type || 'input',
              name: prompt.name,
              message: prompt.message,
              default: prompt.default,
            };
          });
          const answers = await inquirer.prompt(questions);
          promptVars = { ...promptVars, ...answers };
        }
        // Substitute all $VAR, ${VAR}, and [[project_name]] in the script with the answers
        for (const [varName, value] of Object.entries(promptVars)) {
          const varPattern = new RegExp(`\\$${varName}(?![A-Za-z0-9_])|\\$\{${varName}\}|\\[\\[${varName}\\]\]`, 'g');
          runScript = runScript.replace(varPattern, String(value));
        }
        // Show spinner
        const spinner = ora(`Running: ${step.name}`).start();
        try {
          // Use bash to run multi-line scripts in the destination directory
          const child = execa('bash', ['-c', runScript], { stdio: 'inherit', cwd: destDir });
          // Forward SIGINT to child process
          const sigintHandler = () => {
            child.kill('SIGINT');
          };
          process.once('SIGINT', sigintHandler);
          await child;
          process.removeListener('SIGINT', sigintHandler);
          spinner.succeed(`${step.name} completed.`);
        } catch (err) {
          spinner.fail(`${step.name} failed.`);
          if ((err as any).isCanceled || (err as any).killed || (err as any).signal === 'SIGINT') {
            console.log(chalk.red('\nOperation cancelled by user.'));
            process.exit(130);
          }
          console.error(chalk.red(err));
          process.exit(1);
        }
      }
    } catch (err) {
      if ((err as any)?.isCanceled || (err as any)?.killed || (err as any)?.signal === 'SIGINT') {
        console.log(chalk.red('\nOperation cancelled by user.'));
        process.exit(130);
      }
      console.error(chalk.red('Error initializing project:'), err);
      process.exit(1);
    }
  });

program.parse(process.argv);

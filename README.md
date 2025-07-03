# tenex-templates

A simple node CLI to initialize framework projects from templates with interactive prompts and robust file handling.

## Installation

```sh
npm install -g tenex-templates
```

## Usage

```sh
tenex-templates [framework]
```

- If you provide a framework (e.g. `tenex-templates hono`), it will use that template.
- If you omit the framework, you’ll be prompted to select one from the list.

You’ll then be prompted for your project name and any other questions defined by the template.

## Example

```sh
tenex-templates
```
- Select a framework (e.g. `hono`)
- Enter your project name (e.g. `my-hono-app`)
- Answer any custom prompts (e.g. database name, user, password, deploy to Fly IO, etc)
- The CLI will scaffold your project in a new directory, install dependencies, and run any setup steps.

## Template Authoring

Templates live in the `templates/` directory. Each framework has:
- `template.yaml` — defines steps and prompts
- `sample/` — the actual files to copy

### Example `template.yaml`

```yaml
steps:
  - name: Copy Template Files
    description: Copying template files
    run: copy_template_files

  - name: Install Dependencies
    description: Installing dependencies
    run: bun install

  - name: Initialize Database
    description: Setup DB
    prompts:
      - name: DB_NAME
        message: Enter the database name
        type: input
      - name: DB_USER
        message: Enter the Postgres user
        type: input
        default: postgres
    run: |
      echo "DATABASE_URL=postgresql://$DB_USER@localhost:5432/$DB_NAME" > .env
      bunx prisma db push
```

- Use `[[project_name]]` in any file or filename in `sample/` to have it replaced with the actual project name.

## Development

```sh
npm install
npm run build
npm start
```

## Publishing

```sh
npm publish --access public
```

Let me know if you want to add usage examples, badges, or more advanced template authoring docs!
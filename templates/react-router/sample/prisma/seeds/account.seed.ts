import { auth } from "~/lib/auth";
import { config } from 'dotenv';

// Load environment variables from .env file
config();

export async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment variables.");
        return;
    }

    // Seed User
    await auth.api.signUpEmail({
        body: {
            email,
            name: "Root Admin",
            password,
        }
    })
}

main().catch((error) => {
    console.error("Error in main function:", error);
    process.exit(1);
});
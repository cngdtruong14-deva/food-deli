
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runScript = (scriptName) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, scriptName);
        console.log(`\n▶️ Starting: ${scriptName}...`);
        
        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error executing ${scriptName}:`, error);
                reject(error);
                return;
            }
            if (stderr) {
                console.warn(`Warning from ${scriptName}:`, stderr);
            }
            console.log(stdout);
            console.log(`✅ Completed: ${scriptName}`);
            resolve();
        });
    });
};

const seedAll = async () => {
    try {
        console.log("🚀 Starting Full Database Seeding...");
        
        // 1. Seed Branches (This clears old branches and creates new ones)
        await runScript("seedBranches.js");
        
        // 2. Seed Tables (This fetches the NEW branches and creates tables for them)
        await runScript("seedTables.js");
        
        console.log("\n✨ All seeding tasks completed successfully!");
    } catch (error) {
        console.error("\n❌ Seeding failed. See errors above.");
        process.exit(1);
    }
};

seedAll();

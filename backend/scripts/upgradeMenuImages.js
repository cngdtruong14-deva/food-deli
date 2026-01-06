
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const menuDataPath = path.join(__dirname, "../../docs/development/sample-data/menu-quannhautudo.json");
const uploadsDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const menuData = JSON.parse(fs.readFileSync(menuDataPath, "utf-8"));

console.log(`Starting image upgrade for ${menuData.products.length} products...`);

let successCount = 0;
let failCount = 0;

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const request = https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
        request.on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete the file async. (But we don't check the result)
            reject(err);
        });
    });
}

function getHighResUrl(thumbUrl) {
    // Transform:
    // https://storage.quannhautudo.com/data/thumb_400/Data/images/product/...
    // To:
    // https://quannhautudo.com/Data/images/product/...
    
    // 1. Remove subdomain and thumb path
    let newUrl = thumbUrl.replace("https://storage.quannhautudo.com/data/thumb_400", "https://quannhautudo.com");
    
    // Also handle cases where case might differ or pattern is slightly different
    // If it doesn't contain thumb_400, it might already be different? 
    // But we focus on the specific pattern found.
    return newUrl;
}

// Function to create slug (same as seedVietnameseMenu.js)
function createSlug(name) {
    return name.toLowerCase().replace(/\s+/g, "_");
}

async function processImages() {
    for (const product of menuData.products) {
        if (!product.image_url) continue;

        const highResUrl = getHighResUrl(product.image_url);
        const slug = createSlug(product.name);
        const filename = `${slug}.jpg`; // Assuming we save as jpg, but source is webp? 
        // Wait, seed script saves as .jpg but naive fetch might save webp content to .jpg extension.
        // It's better to keep extension consistent or convert. 
        // For simplicity, we save as .jpg filename (as seed script expects) but content might be webp. 
        // Browsers handle this fine usually.
        
        const filePath = path.join(uploadsDir, filename);

        process.stdout.write(`Processing: ${product.name} ... `);

        try {
            await downloadImage(highResUrl, filePath);
            process.stdout.write("DONE\n");
            successCount++;
        } catch (error) {
            process.stdout.write(`FAILED (${error.message})\n`);
            // Fallback: try original if high res fails? 
            // Optional: try downloading original URL if high res fails
            failCount++;
        }
    }

    console.log(`\nUpgrade Completed.`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

processImages();

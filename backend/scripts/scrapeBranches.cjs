const https = require('https');
const fs = require('fs');
const path = require('path');
const urlModule = require('url');

const BASE_URL = 'https://quannhautudo.com';
const LIST_URL = '/co-so.htm';
const OUTPUT_FILE = path.join(__dirname, 'branches.json');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function fetchHtml(urlPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'quannhautudo.com',
            path: urlPath,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

function downloadImage(imageUrl, filename) {
    return new Promise((resolve, reject) => {
        if (!imageUrl) return resolve(null);
        
        // Handle relative URLs if any (though og:image is usually absolute)
        if (imageUrl.startsWith('/')) {
            imageUrl = BASE_URL + imageUrl;
        }

        const parsedUrl = urlModule.parse(imageUrl);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        };

        const file = fs.createWriteStream(path.join(UPLOADS_DIR, filename));

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download image: ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filename);
            });
        });

        req.on('error', (err) => {
            fs.unlink(filename, () => {}); // Delete temp file
            reject(err);
        });

        req.end();
    });
}

function extractLinks(html) {
    const regex = /href="(\/co-so\/[^"]+\.htm)"/g;
    const links = new Set();
    let match;
    while ((match = regex.exec(html)) !== null) {
        links.add(match[1]);
    }
    return Array.from(links);
}

function extractDetails(html, url, index) {
    // 1. Name/Title
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    let name = titleMatch ? titleMatch[1].trim() : 'Unknown Branch';
    name = name.replace(/^Quán Nhậu Tự Do\s*-\s*/i, '').trim();

    // 2. Address (heuristic - simplistic but works for now)
    let address = name; 

    // 3. Image
    // Matches <meta ... property="og:image" ... content="..." /> handling attributes in any order
    // But simplistic regex: <meta[^>]*property="og:image"[^>]*content="([^"]+)"
    let imageUrl = '';
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    if (ogImageMatch) {
        imageUrl = ogImageMatch[1];
    } else {
        // Fallback to header image div
        const headerImgMatch = html.match(/<div class="csdc-header">\s*<img src="([^"]+)"/i);
        if (headerImgMatch) imageUrl = headerImgMatch[1];
    }

    // 4. Phone
    const phone = "*1986";

    // 5. New Fields
    // Capacity
    let capacity = "350 - 500 khách"; 
    const capacityMatch = html.match(/<span class="ac-label">Sức chứa<\/span>\s*<span class="ac-value">([^<]+)<\/span>/i);
    if (capacityMatch) capacity = capacityMatch[1].trim();

    // Floors
    let floors = "2 Tầng";
    const floorsMatch = html.match(/<span class="ac-label">Số tầng<\/span>\s*<span class="ac-value">([^<]+)<\/span>/i);
    if (floorsMatch) floors = floorsMatch[1].trim();

    // Hours
    let openingHours = "08:00 - 23:30";
    const hoursMatch = html.match(/data-timeopen="([^"]+)"\s*data-timeclose="([^"]+)"/i);
    if (hoursMatch) {
        openingHours = `${hoursMatch[1]} - ${hoursMatch[2]}`;
    }

    return {
        name,
        address,
        phone,
        imageUrl,
        url: BASE_URL + url,
        capacity,
        floors,
        openingHours,
        imageFilename: `branch_${index + 1}.jpg`
    };
}

async function run() {
    console.log('Fetching branch list...');
    try {
        const listHtml = await fetchHtml(LIST_URL);
        const links = extractLinks(listHtml);
        console.log(`Found ${links.length} branch links.`);

        const branches = [];
        let index = 0;
        for (const link of links) {
            console.log(`Processing [${index + 1}/${links.length}]: ${link}`);
            try {
                const detailHtml = await fetchHtml(link);
                const details = extractDetails(detailHtml, link, index);
                
                // Download Image
                if (details.imageUrl) {
                    console.log(`   Downloading image: ${details.imageUrl}`);
                    await downloadImage(details.imageUrl, details.imageFilename);
                    details.image = details.imageFilename; // Store just filename for DB
                } else {
                     details.image = "";
                }

                branches.push(details);
            } catch (e) {
                console.error(`   Failed to process ${link}:`, e.message);
            }
            
            // Delay
            await new Promise(r => setTimeout(r, 500));
            index++;
        }

        console.log(`Scraped ${branches.length} branches.`);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(branches, null, 2));
        console.log(`Saved to ${OUTPUT_FILE}`);

    } catch (err) {
        console.error('Error:', err);
    }
}

run();

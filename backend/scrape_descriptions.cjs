const fs = require('fs');
const https = require('https');

const menuData = JSON.parse(fs.readFileSync('menu_full.json', 'utf8'));
const products = menuData.Data;
const descriptionsMap = {};
let completed = 0;

function fetchDetail(proId, proName) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.quannhautudo.com',
            path: '/get-product-home.htm?m=get-detail-product&pSize=1000&proId=' + proId,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': 0,
                'Referer': 'https://quannhautudo.com/',
                'Origin': 'https://quannhautudo.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    if (json.Success && json.Data && json.Data.ProSapo) {
                        descriptionsMap[proName] = json.Data.ProSapo;
                        // console.log(`[${proId}] ${proName}: Found description provided`);
                    } else {
                        // console.log(`[${proId}] ${proName}: No description`);
                    }
                    resolve();
                } catch (e) {
                    console.error(`Error parsing JSON for ${proId}:`, e.message);
                    resolve(); // Resolve anyway to continue
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request ${proId}: ${e.message}`);
            resolve();
        });

        req.end();
    });
}

async function run() {
    console.log(`Starting scrape for ${products.length} items...`);
    
    for (const product of products) {
        await fetchDetail(product.ProId, product.ProName);
        completed++;
        process.stdout.write(`\rProgress: ${completed}/${products.length}`);
        // Delay 200ms
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\nScrape complete.');
    fs.writeFileSync('descriptions.json', JSON.stringify(descriptionsMap, null, 2));
    console.log('Saved descriptions to descriptions.json');
}

run();

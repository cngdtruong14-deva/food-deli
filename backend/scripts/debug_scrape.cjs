const https = require('https');
const fs = require('fs');
const path = require('path');

const URL_PATH = '/co-so/10-nguyen-van-huyen-2.htm';
const OUTPUT_FILE = path.join(__dirname, 'debug.html');

const options = {
    hostname: 'quannhautudo.com',
    path: URL_PATH,
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync(OUTPUT_FILE, data);
        console.log('Saved debug html');
    });
});

req.on('error', (e) => console.error(e));
req.end();

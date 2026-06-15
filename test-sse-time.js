const http = require('http');

console.log(`[${new Date().toISOString()}] Starting request...`);
const req = http.request('http://localhost:5001/api/generate-readme', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log(`[${new Date().toISOString()}] STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`[${new Date().toISOString()}] BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log(`[${new Date().toISOString()}] No more data in response.`);
  });
});

req.on('error', (e) => {
  console.error(`[${new Date().toISOString()}] problem with request: ${e.message}`);
});

req.write(JSON.stringify({ githubLink: 'https://github.com/pranshulgupta33940/Matsya-Drishti' }));
req.end();

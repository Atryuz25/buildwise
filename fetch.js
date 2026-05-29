const fs = require('fs');
const https = require('https');

const urls = {
  login: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQwNTQwZDBlZmQ3NTQ0OGNiNjI4NTMxMTY4YWRhYjQ0EgsSBxCYlKLvsh4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNjAwMTg0ODExMjA3OTg1NTM2Nw&filename=&opi=89354086",
  material_audit: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzExZTE0ZTdkNzFiNTQwY2NhYzcyYzI1NmJlM2MyODE2EgsSBxCYlKLvsh4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNjAwMTg0ODExMjA3OTg1NTM2Nw&filename=&opi=89354086",
  concrete_estimator: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Q4ODE0YzZkMzgwZTRkMWFiZGM3YzI4YmFkMDExNWJiEgsSBxCYlKLvsh4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNjAwMTg0ODExMjA3OTg1NTM2Nw&filename=&opi=89354086"
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
}

async function main() {
  for (const [name, url] of Object.entries(urls)) {
    console.log(`Downloading ${name}...`);
    await download(url, `d:\\atul projects\\consti\\_stitch_designs\\${name}.html`);
  }
  console.log("Done");
}

main();

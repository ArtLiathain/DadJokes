const keyGen = require('./keyGen.js');
const { createServer } = require('node:http');
const { URL } = require('url');
const querystring = require('querystring');
const crypto = require('crypto');
const level = require('level');
const { Level } = level;

const hostname = 'localhost';
const port = 9022;

const server = createServer((req, res) => {
  // Parse the URL
  const parsedUrl = new URL(`http://${req.headers.host}${req.url}`);
  // Extract the query parameters
  const queryParams = querystring.parse(parsedUrl.searchParams.toString());
  // Send a response with the extracted parameters
  res.writeHead(200, {'Content-Type': 'text/plain'});
  
  // Hash the password using SHA-1
  if (queryParams.pass) {
    queryParams.pass = crypto.createHash('sha1').update(queryParams.pass).digest('hex');
  }

  keyStoreLevelDB();
  
  res.end(`Parameters: ${JSON.stringify(queryParams)}`);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


async function keyStoreLevelDB() {
  var publicKey = keyGen.createPublicKey();
  var privateKey = keyGen.createPrivateKey();
  var db;

  try {
    db = new Level('example', { valueEncoding: 'json' });
      
    await db.open();
    console.log('Opened LevelDB');

    await db.put('Public Key : ', publicKey);
    await db.put('Private Key : ', privateKey);
    console.log("Successfully put Keys");

    var getPublicKey = await db.get('Public Key : ');
    var getPrivateKey = await db.get('Private Key : ');

    console.log("Public key Value", getPublicKey);
    console.log("Private key Value", getPrivateKey);
  }
  catch (error) {
    console.log(error);
  } 
  finally {
    if (db) {
      await db.close();
      console.log('Closed LevelDB');
    }
  }

}

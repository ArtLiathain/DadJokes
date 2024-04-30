const { createServer } = require('node:http');
const { URL } = require('url');
const querystring = require('querystring');
const crypto = require('crypto');
const argon2 = require('argon2');


const hostname = 'localhost';
const port = 9022;

const server = createServer(async (req, res) => {
    // Parse the URL
    const parsedUrl = new URL(`http://${req.headers.host}${req.url}`);
    // Extract the query parameters
    const queryParams = querystring.parse(parsedUrl.searchParams.toString());
    // Send a response with the extracted parameters
    res.writeHead(200, {'Content-Type': 'text/plain'});

    // Hash the password using SHA-1
    if (queryParams.pass) {
        // queryParams.pass = crypto.createHash('sha1').update(queryParams.pass).digest('hex');
        try {
            queryParams.pass = await argon2.hash(queryParams.pass);

        } catch (err) {
            console.log("Error hashing password: ", err);
        }
    }

    res.end(`Parameters: ${JSON.stringify(queryParams)}`);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const server = http.createServer((req, res) => {

    // 👉 DEFAULT ROUTE → LOGIN PAGE
    let filePath;

    if (req.url === "/") {
        filePath = path.join(__dirname, "login.html"); // ✅ force login page
    } else {
        filePath = path.join(__dirname, req.url);
    }

    const ext = path.extname(filePath);

    let contentType = "text/html";
    if (ext === ".css") contentType = "text/css";
    if (ext === ".js") contentType = "text/javascript";

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end("File not found");
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});
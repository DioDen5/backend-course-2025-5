const http = require("http");
const fs = require("fs");
const path = require("path");
const { Command } = require("commander");

const program = new Command();

program
    .option("--host <host>", "server host")
    .option("-p, --port <port>", "server port")
    .option("-c, --cache <path>", "cache directory path");

function exitWithMessage(message) {
    console.log(message);
    process.exit(1);
}

program.parse(process.argv);
const options = program.opts();

if (!options.host) {
    exitWithMessage("Please, specify host");
}

if (!options.port) {
    exitWithMessage("Please, specify port");
}

if (!options.cache) {
    exitWithMessage("Please, specify cache");
}

const PORT = Number(options.port);

if (!Number.isFinite(PORT) || PORT <= 0) {
    exitWithMessage("Invalid port");
}

if (!fs.existsSync(options.cache)) {
    fs.mkdirSync(options.cache, { recursive: true });
}

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server started");
});

server.listen(PORT, options.host, () => {
    console.log(`Server running at http://${options.host}:${PORT}`);
});



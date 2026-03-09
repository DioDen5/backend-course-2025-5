const http = require("http");
const fs = require("fs");
const path = require("path");
const { Command } = require("commander");
const superagent = require("superagent");

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

if (!options.host) exitWithMessage("Please, specify host");
if (!options.port) exitWithMessage("Please, specify port");
if (!options.cache) exitWithMessage("Please, specify cache");

const PORT = Number(options.port);

if (!Number.isFinite(PORT) || PORT <= 0) {
    exitWithMessage("Invalid port");
}

if (!fs.existsSync(options.cache)) {
    fs.mkdirSync(options.cache, { recursive: true });
}

function getFilePath(code) {
    return path.join(options.cache, `${code}.jpg`);
}

async function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        req.on("data", chunk => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {
    const code = req.url.replace("/", "");
    const filePath = getFilePath(code);

    try {
        if (req.method === "GET") {
            try {
                const data = await fs.promises.readFile(filePath);
                res.writeHead(200, { "Content-Type": "image/jpeg" });
                return res.end(data);
            } catch {
                try {
                    const response = await superagent
                        .get(`https://http.cat/${code}`)
                        .responseType("blob");

                    const imageBuffer = Buffer.from(response.body);
                    await fs.promises.writeFile(filePath, imageBuffer);

                    res.writeHead(200, { "Content-Type": "image/jpeg" });
                    return res.end(imageBuffer);
                } catch {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    return res.end("Not Found");
                }
            }
        }

        if (req.method === "PUT") {
            const body = await readRequestBody(req);
            await fs.promises.writeFile(filePath, body);
            res.writeHead(201, { "Content-Type": "text/plain" });
            return res.end("Created");
        }

        if (req.method === "DELETE") {
            try {
                await fs.promises.unlink(filePath);
                res.writeHead(200, { "Content-Type": "text/plain" });
                return res.end("Deleted");
            } catch {
                res.writeHead(404, { "Content-Type": "text/plain" });
                return res.end("Not Found");
            }
        }

        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method Not Allowed");

    } catch {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Server Error");
    }
});

server.listen(PORT, options.host, () => {
    console.log(`Server running at http://${options.host}:${PORT}`);
});
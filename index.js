const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3001
const PUBLIC_DIR = path.join(__dirname, 'public')

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
}

function sendFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500)
            return res.end('Server error')
        }
        const ext = path.extname(filePath).toLowerCase()
        const type = MIME[ext] || 'application/octet-stream'
        res.writeHead(200, { 'Content-Type': type })
        res.end(data)
    })
}

const server = http.createServer((req, res) => {
    try {
        const urlPath = decodeURIComponent(req.url.split('?')[0])
        let safePath = urlPath.replace(/\/+$/,'')
        if (safePath === '') safePath = '/'

        const filePath = path.join(PUBLIC_DIR, safePath)

        // If file exists and is inside public, serve it
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            return sendFile(res, filePath)
        }

        // If the request looks like a path to a directory with index.html
        const indexPath = path.join(PUBLIC_DIR, safePath, 'index.html')
        if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
            return sendFile(res, indexPath)
        }

        // SPA fallback: serve public/index.html for any unknown path (enables direct links)
        const fallback = path.join(PUBLIC_DIR, 'index.html')
        if (fs.existsSync(fallback)) return sendFile(res, fallback)

        res.writeHead(404)
        res.end('Not found')
    } catch (err) {
        res.writeHead(500)
        res.end('Server error')
    }
})

server.listen(PORT, () => console.log(`Plantgram UI static server listening on port ${PORT}`))

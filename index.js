const fs = require('fs')
const Drive = require('./lib/drive')
const Archive = require('./lib/archive')
const Swarm = require('./lib/swarm')
const Importer = require('./lib/importer')
const prompt = require('./lib/prompt')

module.exports = (dir, _opts) => {
	const opts = Object.assign({}, {
		ignore: [/\.db$/, /\.swp$/]
	}, _opts)

	if (!pathExists(dir)) {
		throw new Error('Directory does not exist')
		process.exit(1)
	}

	const drive = Drive(dir)
	const writeArchive = Archive(drive, dir)
	const link = writeArchive.key.toString('hex')
	const writeSwarm = Swarm(new Buffer(link, 'hex'))
	const fileStatus = Importer(writeArchive, dir, opts)

	console.log('Your key: ', link)

	writeSwarm
		.on('connection', conn => {
			conn.pipe(writeArchive.replicate()).pipe(conn)
			console.log('opened write connection to peer...')
		})

	writeArchive
		.on('upload', () => console.log('Uploading data to peer...'))

	fileStatus
		.on('file watch event', data => console.log(data))

	prompt('Enter peer key: ')
		.then(key => {
			const link = new Buffer(key, 'hex')
			console.log(link.toString('hex'))
			const readArchive = Archive(drive, dir, link)
			const readSwarm = Swarm(link)

			readSwarm
				.on('connection', conn => {
					conn.pipe(readArchive.replicate()).pipe(conn)
					console.log('opened read connection to peer...')
				})

			readArchive
				.on('download', () => console.log('Downloading data from peer...'))
		})
		.catch(err => console.log(err))
}

function pathExists(path) {
	try {
		fs.statSync(path)
		return true
	} catch (err) {
		return false
	}
}
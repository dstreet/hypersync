const fs = require('fs')
const path = require('path')
const Drive = require('./lib/drive')
const Archive = require('./lib/archive')
const Swarm = require('./lib/swarm')
const Importer = require('./lib/importer')
const prompt = require('./lib/prompt')
const Journal = require('./lib/journal')

const JOURNAL_FILENAME = '.hsyncj'

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

	let ignoreUnlink = false

	console.log('Your key: ', link)

	writeSwarm
		.on('connection', conn => {
			conn.pipe(writeArchive.replicate()).pipe(conn)
			console.log('opened write connection to peer...')
		})

	writeArchive
		.on('upload', () => console.log('Uploading data to peer...'))

	fileStatus
		.on('file watch event', data => {
			if ([...data.path.split('/')].pop() === JOURNAL_FILENAME || data.mode !== 'unlink') return

			if (data.mode === 'unlink' && ignoreUnlink) {
				ignoreUnlink = false
				return
			}
			
			const entry = [data.mode, data.path.replace(dir + '/', ''), (new Date()).toJSON()].join('\t')

			console.log('Watch event:', entry)
			fs.appendFile(path.join(dir, JOURNAL_FILENAME), entry + '\n', err => {
				if (err) return console.log(err)
				console.log('Event written to journal...')
			})
		})

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

			const archiveList = readArchive.list()
			
			archiveList.on('data', entry => {
				if (entry.name === JOURNAL_FILENAME) {
					const rs = readArchive.createFileReadStream(entry)
					
					// Create a journal and delete a file if that is the last
					// entry in the journal
					Journal.createFromReadStream(rs)
						.then(journal => {
							if (journal.lastEntry.mode === 'unlink') {
								const file = path.join(dir, journal.lastEntry.path)

								if (!pathExists(file)) return

								ignoreUnlink = true
								fs.unlink(file, err => {
									if (err) return console.log(err)
									console.log('Deleted file:', file)
								})
							}
						})
				}
			})

			readArchive
				.on('download', data => console.log('Downloading data from peer...'))
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
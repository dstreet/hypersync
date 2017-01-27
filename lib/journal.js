const fs = require('fs')

class Journal {
	constructor(entries) {
		this.entries = entries
	}

	get lastEntry() {
		return [...this.entries].pop()
	}
}

module.exports = Journal

Journal.createFromReadStream = stream => {
	return new Promise((res, rej) => {
		let contents = ''

		stream.setEncoding('utf8')
		stream.on('data', chunk => contents += chunk)
		stream.on('error', err => rej(err))
		stream.on('end', () => {
			const entries = contents.trim().split('\n').map(line => {
				const columns = line.split('\t')

				return {
					mode: columns[0],
					path: columns[1],
					time: columns[2]
				}
			})

			res(new Journal(entries))
		})
	})
}
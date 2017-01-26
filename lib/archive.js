const raf = require('random-access-file')
const path = require('path')

module.exports = (drive, dir, link) => {
	const opt = {
		file: name => {
			return raf(path.join(dir, name))
		}
	}

	return link ? drive.createArchive(link, opt) : drive.createArchive(opt)
}
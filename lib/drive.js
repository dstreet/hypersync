const hyperdrive = require('hyperdrive')
const level = require('level')
const path = require('path')

const DB_NAME = '.hsync.db'

module.exports = dir => {
	const db = level(path.join(dir, DB_NAME))
	
	return hyperdrive(db)
}

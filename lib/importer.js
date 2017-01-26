const hyperImport = require('hyperdrive-import-files')
const path = require('path')

module.exports = (archive, dir, _opt) => {
	const opt = Object.assign({}, { watch: true }, _opt)

	return hyperImport(archive, dir, opt, err => {
		if (err) throw new Error(`Failed to import files from ${dir}`)
	})
}
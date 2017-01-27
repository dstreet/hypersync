const hyperImport = require('hyperdrive-import-files')
const chokidar = require('chokidar')
const path = require('path')

module.exports = (archive, dir, _opt) => {
	const opt = Object.assign({}, { watch: true }, _opt)
	const status = hyperImport(archive, dir, opt, err => {
		if (err) throw new Error(`Failed to import files from ${dir}`)
	})
	const watcher = chokidar.watch(dir, {
		persistent: true,
		ignored: opt.ignore
	})

	watcher.on('unlink', path => {
		status.emit('file watch event', { mode: 'unlink', path })
	})

	return status
}
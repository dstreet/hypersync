const readline = require('readline')

module.exports = msg => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	})

	return new Promise((res, rej) => {
		try {
			rl.question(msg, answer => {
				rl.close()
				res(answer)
			})
		} catch (err) {
			rej(err)
		}
	})
}


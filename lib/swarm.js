const discoverySwarm = require('discovery-swarm')

module.exports = link => {
	const swarm = discoverySwarm()

	swarm.listen()
	swarm.join(link)

	return swarm
}
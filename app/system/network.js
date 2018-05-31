
module.exports.parse = processDefs => {
  const network = {
    processes: [],
    processLookup: {}
  }

  // simple location for now
  const baseLocation = './processes/'

  forEachChain(processDefs, (def, i) => {
    const p = require(`${baseLocation}/${def.type}/process.js`)
    const config = p.config()
    const state = p.state(config)
    const item = {
      config,
      state,
      def,
      obj: p
    }
    network.processes.push(item)
    network.processes[def.id] = item
  })

  return network
}

module.exports.updateLinks = (network, process) => {
  process.links = []
  process.def.links.forEach(link => {
    const other = network.processLookup[link.processId]
    const statePiece = other.state[link.stateId]
    process.links.push()
  })
}

module.exports.initLinks = network => {

}
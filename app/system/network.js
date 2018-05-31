
module.exports.parse = processDefs => {
  const network = {
    processes: [],
    processLookup: {}
  }

  // simple location for now
  const baseLocation = './processes/'

  forEachChain(processDefs, (def, i) => {
    const p = require(`${baseLocation}/${def.type}`)
    const config = p.config()
    const state = p.state(config)
    const item = {
      config,
      state,
      obj: p
    }
    network.processes.push(item)
    network.processes[def.id] = item
  })

  return network
}
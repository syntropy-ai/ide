
// load config from command line
const fs = require('fs')
const path = require('path')

const args = require('electron').remote.process.argv
const def = require(args[2])
const experimentPath = path.dirname(args[2])

const state = {}

const parseCode = str => {
  //return new Function('state', str)
  var GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor
  return new GeneratorFunction('state', str)
}

const buildLayer = layerDef => {

  const layer = {
    def: layerDef
  }

  if(layerDef.file){
    code = fs.readFileSync(path.join(experimentPath, layerDef.file), 'utf8')
    code += `\n//# sourceURL=layer/${layerDef.file}`
    layer.generator = parseCode(code)
  }

  if(layerDef.children){
    layer.childProgram = buildProgram(layerDef.children)
  }

  return layer
}

const buildProgram = layers => {
  return {
    layerIndex: 0,
    layers: layers.map(buildLayer)
  }
}

const layerPass = layer => {
  if(!layer.run){
    layer.run = layer.generator(state)
  }

  // run the next layer iteration
  const result = layer.run.next()

  return result.done
}

const render = timeStamp => {
  const pp = document.getElementById('txt')
  pp.textContent = 'Actually Rendering: ' + timeStamp
  console.log('rendering')
}

const programPass = timeStamp => {
  const { layers } = program
  while(program.layerIndex < layers.length){
    if(layerPass(layers[program.layerIndex])){
      program.layerIndex++
    }else{
      break
    }
  }
  render(timeStamp)
  if(program.layerIndex < layers.length){
    requestAnimationFrame(programPass)
  }  
}

const program = buildProgram(def.layers)
requestAnimationFrame(programPass)

console.log('complete')

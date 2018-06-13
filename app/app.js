
// load config from command line
const fs = require('fs')
const path = require('path')

const args = require('electron').remote.process.argv
const def = require(args[2])
const experimentPath = path.dirname(args[2])

const state = {}

const buildIterator = (runner, runFunc) => state => {
  if(runFunc){ runFunc(state) }
  runner.forEach(f => f.run(state))
  state.iteratorIndex++
  return state.iteratorIndex < 100
}

const buildLayer = layerDef => {  
  var runFunc
  if(layerDef.file){
    var fileText = fs.readFileSync(path.join(experimentPath, layerDef.file), 'utf8')
    fileText += `\n//# sourceURL=${layerDef.file}`
    runFunc = new Function('state', fileText)
  }
  
  if(layerDef.type === 'iterator'){
    const iterRunner = layerDef.layers.map(buildLayer)    
    runFunc = buildIterator(iterRunner, runFunc)
  }

  return {
    def: layerDef,
    run: runFunc
  } 
}

const runner = def.layers.map(buildLayer)

state.iteratorIndex = 0
var doneIndex = 0
while(doneIndex < runner.length){
  for(; doneIndex<runner.length; doneIndex++){
    // if layer returns truthy it means to stop doing regular processing here
    if(runner[doneIndex].run(state)){
      break
    }
  }
}

console.log('complete')

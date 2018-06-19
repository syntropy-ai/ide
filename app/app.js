
// load config from command line
const fs = require('fs')
const path = require('path')
const sane = require('sane')

const args = require('electron').remote.process.argv
const projectPath = args[2]
const experimentConfig = path.join(projectPath, args[3])
const experimentPath = path.dirname(experimentConfig)
const def = require(experimentConfig)

require('module').globalPaths.push(path.join(projectPath, 'node_modules'))

const state = {}

const noop = () => {}

const parseFunction = (str, params) => {
  return new Function(...params, str)
}

const parseGenerator = (str, params) => {
  const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor
  return new GeneratorFunction(...params, str)
}

const parseHTML = str => {
  const parser = new DOMParser()
  return parser.parseFromString(str, 'text/html')
}

const sourceString = label => {
  return `\n//# sourceURL=layer/${label}`
}

// Convert a config object to a string.
// This means either grabbing a string directly from the config,
// or loading a file, etc (for now just this)
const getString = obj => {
  var str = obj
  if(obj.file){
    str = fs.readFileSync(path.join(experimentPath, obj.file), 'utf8')
  }
  return str
}

const buildLayer = layerDef => {

  const layer = {
    def: layerDef
  }

  if(layerDef.code){
    const source = sourceString(`layers/${layerDef.id}/code`)
    layer.code = parseGenerator(getString(layerDef.code) + source, ['state', 'init'])
  }

  /*if(layerDef.children){
    layer.childProgram = buildProgram(layerDef.children)
  }*/

  return layer
}

const buildRenderer = rendererDef => {

  const renderer = {
    def: rendererDef
  }

  // add the renderer container
  const renderers = document.getElementById('renderers')
  renderer.containerElement = document.createElement('div')
  renderers.appendChild(renderer.containerElement)

  if(rendererDef.html){
    renderer.html = parseHTML(getString(rendererDef.html))
    container.appendChild(renderer.html)
    renderer.rootElement = renderer.html
  }

  /*if(rendererDef.css){

  }*/

  if(rendererDef.code){
    const source = sourceString(`renderers/${rendererDef.id}/code`)
    renderer.code = parseFunction(getString(rendererDef.code) + source, ['state', 'domParent', 'init', ''])
  }

  return renderer
}

const layerInit = fn => fn({ state })

const layerPass = layer => {
  if(!layer.run){
    layer.run = layer.code(state, layer.hasCompleted ? noop : layerInit)
  }

  // run the next layer iteration
  const result = layer.run.next()

  // remove the generator once it is complete so that it can be run again
  if(result.done){
    layer.hasCompleted = true
    layer.run = null
  }

  return result.done
}

const rendererInit = fn => fn({ state, })

const render = timeStamp => {
  const { renderers } = program
  renderers.forEach(r => {
    const domParent = r.containerElement
    r.code(state, domParent, r.hasCompleted ? noop : (fn) => fn({ state, domParent }))
    r.hasCompleted = true
  })
  program.timeLastRendered = Date.now()
}

const programPass = timeStamp => {
  const { layers, fps, forever } = program

  while(program.layerIndex < layers.length){
    if(layerPass(layers[program.layerIndex])){
      program.layerIndex++
    }else{
      break
    }
  }

  // work out how much work to do keep approximate
  // desired framerate
  const waitUntilRender = program.lastTimeRendered + ((1 / fps) * 1000)
  timeStamp = Date.now()

  // render
  if(timeStamp >= waitUntilRender){
    render(timeStamp)
    program.lastTimeRendered = timeStamp
  }  

  // if program is not done or forever is on restart
  if(forever || program.layerIndex < layers.length){
    if(program.layerIndex >= layers.length){ program.layerIndex = 0 }
    requestAnimationFrame(programPass)
  }
}

const load = config => {
  const program = {
    layerIndex: 0,
    playing: false,
    forever: true,
    fps: 60,
    lastTimeRendered: 0,
    layers: config.layers.map(buildLayer)
  }

  if(config.renderers){
    program.renderers = config.renderers.map(buildRenderer)
  }

  return program
}

const play = () => {
  program.playing = true
  requestAnimationFrame(programPass)
}

const program = load(def)
play()

// start file watching
var watcher = sane(experimentPath, { glob: ['**/*.js'] })
watcher.on('change', function (filepath, root, stat) { 
  console.log('file changed', filepath, root)

  // hack temp relationship between file and layer (needs file lookup)
  const layerIndex = program.layers.findIndex(l => l.def.code.file.endsWith(filepath))
  if(layerIndex >= 0){
    program.layers[layerIndex] = buildLayer(program.layers[layerIndex].def)
  }else{
    const rendererIndex = program.renderers.findIndex(r => r.def.code.file.endsWith(filepath))
    if(rendererIndex >= 0){
      program.renderers[rendererIndex] = buildRenderer(program.renderers[rendererIndex].def)
    }
  }
})
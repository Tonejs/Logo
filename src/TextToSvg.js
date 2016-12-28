// node script for converting text into svg
const TextToSVG = require('text-to-svg')
const textToSVG = TextToSVG.loadSync('../Roboto_Mono/RobotoMono-Regular.ttf')
const options = {
	x: 0, y: -15, fontSize: 100, anchor: 'top',
	attributes : {fill : 'white'}
}
const svgT = textToSVG.getSVG('T', options)
const svgOne = textToSVG.getSVG('one', options)
const svgJS = textToSVG.getSVG('.js', options)

const fs = require('fs')
fs.writeFileSync('T.svg', svgT)
fs.writeFileSync('one.svg', svgOne)
fs.writeFileSync('js.svg', svgJS)


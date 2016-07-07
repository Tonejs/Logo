var webpack = require("webpack");

module.exports = {
	"context": __dirname,
	entry: {
		"Logo": "src/Logo",
		"Waveform": "src/Waveform",
	},
	output: {
		filename: "./build/[name].js",
		library : "[name]",
		libraryTarget : "umd"
	},
	externals: { 
		Tone : "Tone",
	},
	resolve: {
		root: __dirname,
		modulesDirectories : ["src"],
	},
	plugins: [new webpack.optimize.UglifyJsPlugin({minimize: true})],
	module: {
		loaders: [
			{
				test: /\.scss$/,
				loader: "style!css!autoprefixer!sass"
			}
		]
	},
};
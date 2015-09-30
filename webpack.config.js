var webpack = require("webpack");

module.exports = {
	"context": __dirname,
	entry: {
		"Logo": "Logo/Logo",
	},
	output: {
		filename: "./build/[name].js",
		library : "Logo",
		libraryTarget : "umd"
	},
	externals: { 
		jquery: "jQuery",
		Tone : "Tone",
	},
	resolve: {
		root: __dirname,
		modulesDirectories : ["style", "Logo", "../Tone.js/build"],
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
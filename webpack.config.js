var webpack = require("webpack");

module.exports = {
	"context": __dirname,
	entry: {
		"Logo": "app/Logo",
	},
	output: {
		filename: "./build/[name].js",
		chunkFilename: "./build/[id].js",
		sourceMapFilename : "[file].map",
		library : "Logo",
		libraryTarget : "umd"
	},
	externals: { 
		jquery: "jQuery",
		Tone : "Tone",
	},
	resolve: {
		root: __dirname,
		modulesDirectories : ["bower_components", "style", "app", "../Tone.js/build"],
	},
	plugins: [
		new webpack.ResolverPlugin([
			new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])], ["normal", "loader"])
	   ],
	 module: {
		loaders: [
			{
				test: /\.scss$/,
				loader: "style!css!autoprefixer!sass"
			},
			{
				test: /\.json$/,
				loader: "json"
			}
		]
	},
	devtool: "#eval"
};
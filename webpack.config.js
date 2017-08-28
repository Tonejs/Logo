var webpack = require("webpack");

module.exports = {
	entry: {
		"Logo": "./src/Logo",
		"Waveform": "./src/Waveform",
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
		modules : ["./src"],
	},
	module: {
		loaders: [
			{
				test: /\.scss$/,
				loader: "style-loader!css-loader!autoprefixer-loader!sass-loader"
			},
			{
				test: /\.svg$/,
				loader: "url-loader"
			}
		]
	},
};

// Webpack modules import
import Webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";

// Webpack plugins require
import UglifyJsPlugin = require("uglifyjs-webpack-plugin");
import OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
import MiniCssExtractPlugin = require("mini-css-extract-plugin");
import HtmlWebpackPlugin = require("html-webpack-plugin");

// Common node module functions import
import { readFileSync } from "fs";
import { resolve } from "path";

/*
	Webpack preferences
*/
const serverPreferences = defaultServerConfiguration({ contentBase: "public", https: true });
const distPath = "dist";
const entryPoints = {
	main: "./src/main.tsx"
};

// Webpack configuration
module.exports = {
	target: "web",
	mode: "development",

	devtool: "eval-source-map",
	resolve: { extensions: [ ".ts", ".js", ".tsx", ".jsx" ] },

	parallelism: 4,
	entry: entryPoints,

	output: {
		filename: "js/[name].js",
		path: resolve(distPath)
	},

	module: {
		rules: [
			{
				test: /\.less$/g,
				loaders: [ MiniCssExtractPlugin.loader, "css-loader", "postcss-loader", "less-loader" ]
			},
			{ test: /\.tsx?$/, loader: "ts-loader", exclude: resolve("tests") },
			{
				test: /\.css$/,
				use: [ MiniCssExtractPlugin.loader, "css-loader", "postcss-loader" ]
			}
		]
	},

	plugins: [
		new HtmlWebpackPlugin({
			inject: true,
			template: "./src/index.html",
			filename: "index.html"
		}),

		new MiniCssExtractPlugin({
			chunkFilename: "css/[id].css",
			filename: "css/[name].css"
		})
	],

	optimization: {
		minimize: true,
		minimizer: [
			new UglifyJsPlugin({
				cache: true,
				parallel: true,
				sourceMap: true,
				extractComments: false,
				uglifyOptions: {
					compress: true,
					ie8: true,
					output: { comments: false },
					safari10: true
				}
			}),
			new OptimizeCSSAssetsPlugin({
				cssProcessorOptions: { discardComments: { removeAll: true } },
				canPrint: true
			})
		],

		splitChunks: {
			chunks: "all",
			maxAsyncRequests: 16,
			maxInitialRequests: 20,

			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name (module: any) {
						const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
						return `module~${packageName.replace("@", "~")}`;
					}
				}
			}
		},

		providedExports: true,
		concatenateModules: true,
		usedExports: true,
		removeAvailableModules: true
	},

	devServer: serverPreferences
} as Webpack.Configuration;

function defaultServerConfiguration ({
	host = "0.0.0.0",
	port = 8080,
	contentBase = null as string | null,
	https = false
}) {
	const certificatesPath = "C:\\Users\\knownOut\\.cert";
	const httpsConfiguration = {
		key: readFileSync(`${certificatesPath}\\localhost+4-key.pem`, "utf8"),
		cert: readFileSync(`${certificatesPath}\\localhost+4.pem`, "utf8")
	};

	const configurationObject = {
		host,
		port,

		writeToDisk: true,
		historyApiFallback: true,
		publicPath: "/"
	};

	return Object.assign(
		contentBase ? { contentBase: resolve(contentBase) } : {},
		https ? { https: httpsConfiguration } : {},
		configurationObject
	) as WebpackDevServer.Configuration;
}

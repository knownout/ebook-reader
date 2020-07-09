module.exports = {
	roots: [ "<rootDir>" ],
	transform: {
		"^.+\\.tsx?$": "ts-jest"
	},

	preset: "ts-jest",

	testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.(ts|js)x?$",
	moduleFileExtensions: [ "ts", "tsx", "js", "jsx" ],
	setupFilesAfterEnv: [ "<rootDir>/__jest__/setupTests.js" ],

	moduleNameMapper: {
		"\\.(css|less|sass|scss)$": "<rootDir>/__jest__/styleMock.js",
		"\\.(gif|ttf|eot|svg)$": "<rootDir>/__jest__/fileMock.js"
	}
};

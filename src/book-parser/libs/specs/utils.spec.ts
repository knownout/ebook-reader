import { getCleanText, tagOptionsReplaceExpression } from "../utils";

describe("Text cleaning with regular expressions test", () => {
	const testTexts = [
		[
			`<div>Hello  <strong attrib="some_data">weird</strong> world</div>,   hello!`,
			`Hello [strong]weird[/strong] world, hello!`
		],
		[ ` Hello <span>weird  world</span> `, `Hello weird world` ]
	];

	it("whenRegexSupported expression test", () => {
		const procedureTestText = [
			`Hello <span data="value" some-option="true">world</span>!`,
			"Hello <span>world</span>!"
		];

		expect(procedureTestText[0].replace(tagOptionsReplaceExpression, "")).toEqual(procedureTestText[1]);
	});

	it("Simple text cleaning procedure test", () => {
		expect(getCleanText(testTexts[0][0])).toEqual(testTexts[0][1]);
	});

	it("Advanced text cleaning procedure test", () => {
		expect(getCleanText(testTexts[1][0])).toEqual(testTexts[1][1]);
	});
});

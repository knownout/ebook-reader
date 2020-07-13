import BookParserCore from "../book-parser-core";
import BookParser from "../book-parser";

class public_BookParserCore extends BookParserCore {
	_parseKeywords = this.parseKeywords;
	_parseGenres = this.parseGenres;
}

describe("\n  BookParserCore functionality test", () => {
	const core = new public_BookParserCore();

	it("parseKeywords method test", () => {
		expect(core._parseKeywords("самиздат")).toEqual(String());

		expect(core._parseKeywords("network_literature")).toEqual("Network literature");
		expect(core._parseKeywords("litrpg")).toEqual("ЛитРПГ");
	});

	it("parseGenres method test", () => {
		expect(core._parseGenres("sf_action")).toEqual("Action");
		expect(core._parseKeywords("public_book")).toEqual("Public book");
	});
});

it("BookParser functionality test", async () => {
	const parser = new BookParser();

	const result = await parser.loadBookData(null).catch(() => "nothing");
	expect(result).toEqual("nothing");
});

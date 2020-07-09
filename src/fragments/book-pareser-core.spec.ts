import BookParserCore from "./book-parser-core";
import { shallow } from "enzyme";

class BookParser extends BookParserCore {
	_parseBookContent = this.parseBookContent;
	_parseHTML = this.parseHTML;
	_selectElement = this.selectElement;
	_parseGenres = this.parseGenres;
	_parseKeywords = this.parseKeywords;
	_parseImageBase64 = this.parseImageBase64;
}

const bookParser = new BookParser();
const xml = document.createElement("div"),
	section = document.createElement("section"),
	paragraph = document.createElement("p"),
	titleParagraph = document.createElement("p"),
	divTitle = document.createElement("div");

paragraph.innerHTML = "Book chapter content";
titleParagraph.innerHTML = "Chapter title";

divTitle.className = "title";
divTitle.appendChild(titleParagraph);

section.append(divTitle, paragraph);
xml.appendChild(section);

describe("\n  Book content parsing test", () => {
	const parsedBookData = bookParser._parseBookContent(xml, "section", "p");
	it("Chapter title parsing", () => {
		expect(parsedBookData[0].title).toEqual("Chapter title");
	});

	it("Chapter content parsing", () => {
		const chapterText = shallow(parsedBookData[0].text[0]).text();
		expect(chapterText).toEqual("Book chapter content");
	});
});

describe("\n  Additional functionality test", () => {
	it("selectItem", () => {
		const select = bookParser._selectElement(xml, "section p");
		expect(select.entries()[0]).toBeInstanceOf(Element);
		expect(Array.isArray(select.entries())).toBeTruthy();

		expect(select.entry()).toBeInstanceOf(Element);
		expect(select.html()).toEqual("Chapter title");

		const selectExcept = bookParser._selectElement(xml, "section p div").except(() => {
			const replacer = document.createElement("div");
			replacer.innerHTML = "Replacer";

			return replacer;
		});

		expect(selectExcept.html()).toEqual("Replacer");
	});

	it("parseHTML", () => {
		const html = bookParser._parseHTML(bookParser._selectElement(xml, "section p").entry());

		expect(html).toEqual("Chapter title");
	});

	it("parseGenres", () => expect(bookParser._parseGenres("sf_cyberPunk")).toEqual("Cyberpunk"));

	it("parseKeywords", () => {
		expect(bookParser._parseKeywords("самиздат")).toEqual("");

		expect(bookParser._parseKeywords("антиУтопия")).toEqual("Антиутопия");
		expect(bookParser._parseKeywords("litrpg")).toEqual("ЛитРПГ");
	});

	it("parseImageBase64", () =>
		expect(bookParser._parseImageBase64("0")).toEqual("data:image/jpeg;base64,0"));
});

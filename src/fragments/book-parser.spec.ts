import BookParser from "./book-parser";

const bookParser = new BookParser();
it("BookParser loading null data test", () => {
	bookParser.loadBookData(null).catch(e => {
		expect(e.message).toEqual("Exception while processing selected file");
	});
});

import { loadAsync } from "jszip";
import { FileOpenException } from "./libs/exceptions";
import { getCleanText, TNCXChapterData } from "./libs/utils";
import $ from "./libs/xmltool";
import BookParserCore from "./core";

export default class BookParser extends BookParserCore {
	public constructor (file: File | FileList | null) {
		// Verifying and converting the retrieved file
		if (!file) throw new FileOpenException();
		else if (file instanceof FileList) {
			if (file.length < 1) throw new FileOpenException();
			super(loadAsync(file[0]));
		} else super(loadAsync(file));
	}

	// Stub for the method of opening an e-book
	public async openBook () {
		const contentFilePath = await this.processContainerFile(),
			bookData = await this.processContentFile(contentFilePath),
			ncxChapterData = await this.processNCXChapterDataFile(bookData.ncxChapterDataFile);

		const bookContent = await this.loadBookContent(bookData.bookDataOrder, ncxChapterData);
		console.log(bookContent);
	}

	public async loadBookContent (bookDataOrder: string[], ncxFileData: TNCXChapterData[]) {
		const zipFile = await this.zipFile;
		let bookPageDocuments: { [key: string]: Document } = {};

		// Unzip the e-book pages as DOM trees
		for await (const page of bookDataOrder) {
			const pageDocument = await this.openCompressedXMLFile(zipFile, page);
			bookPageDocuments[page] = pageDocument;
		}

		// List of chapters data (text and title)
		const chaptersDataList: { title: string; text: string[] }[] = [];

		// Processing ncx file data and loading each chapter data as text and title
		for await (const chapterData of ncxFileData) {
			/**
             * Split the fileLocation variable by the name of the chapter file and the 
             * location of the chapter in that file
             */
			const [ file, location ] = chapterData.fileLocation.split("#");

			// If file doesn't exist, throw file exception
			if (!(file in bookPageDocuments)) throw new FileOpenException();

			//Get the wrapped body of a document
			const content = $(bookPageDocuments[file].body),
				chapterParagraphsList = [];

			// Get the element that the chapter starts with
			let chapterStartElement = location ? content.find("#" + location)[0].obj : content.obj.children[0];

			// Get the next element after the element that the chapter starts with
			let nextElement = chapterStartElement.nextSibling as Element;

			/**
             * As long as the next element exists and has a different tag than the chapter start 
             * element, write the inner text of this element to the chapter's paragraph list. 
             */
			while (nextElement && nextElement.tagName !== chapterStartElement.tagName) {
				chapterParagraphsList.push(getCleanText(nextElement.innerHTML || "").trim());
				nextElement = nextElement.nextSibling as Element;
			}

			// Add data to the global chapter list
			chaptersDataList.push({
				title: getCleanText(chapterStartElement.innerHTML),
				text: chapterParagraphsList
			});
		}

		return chaptersDataList.filter(e => e.text.length > 1);
	}
}

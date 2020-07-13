import { TBookChapterData } from "./book-parser-core";
import XmlTree from "./xml-tree";

import ReactHTMLParser from "react-html-parser";

/**
 * Function for parsing an array of html strings as a list of book chapters
 * @param html an array of html strings
 * @param bookLanguage language of the current book for translating 
 * automatically generated words
 */
export default async function HtmlParser (html: string[], bookLanguage?: string | null) {
	/*
        Asynchronous HTML string array analysis and parsing
    */
	const parseProcess = new Promise((resolve, reject) => {
		setTimeout(() => {
			let inlineMode = html.length < 2;
			let bookChaptersList: string[] = html.map(e => e.trim()).filter(Boolean);

			/*
                If there are no default chapter separators in the book, an attempt is made to 
                analyze and separate the book chapters
            */
			if (inlineMode) {
				const chapter = new DOMParser().parseFromString(html[0], "text/xml"),
					xmlTree = new XmlTree(chapter);

				// Search for chapter separators in a book content
				xmlTree
					.select(`[class*="section"][class*="end"]`)
					.catch(`[class*="chapter"][class*="end"]`)
					.catch(null);

				if (!xmlTree.entry()) {
					// console.warn(
					// 	"Inline parsing mode cannot be used with this book: chapters delimiter not found"
					// );

					resolve(bookChaptersList);
					return;
				}

				const separatorClassName = xmlTree.entry(0, e => e.className);

				const chaptersList: string[][] = [];
				const contentSection = xmlTree.select("section").catch(null).entry();
				if (!contentSection) {
					reject("Section element not found in provided html");
					return;
				}

				let chapterIndex = 0;

				// Separate book contents using separator
				Array.from(contentSection.children).forEach(child => {
					// If the separation element is reached, proceed to the next chapter.
					if (child.className.includes(separatorClassName)) {
						chapterIndex++;
						return;
					}

					// If the current array of chapter elements is not assigned, assign it
					if (!chaptersList[chapterIndex]) chaptersList[chapterIndex] = [];

					if (child.innerHTML.trim().length < 1) return;
					chaptersList[chapterIndex].push(child.outerHTML.trim());
				});

				bookChaptersList = chaptersList
					.map(e => `<section>${e.join("")}</section>`)
					.filter(Boolean);
			}

			resolve(bookChaptersList);
		});
	}) as Promise<string[]>;

	// Waiting for completion of the parsing process and catching exceptions
	let raw_chaptersList = await parseProcess.catch(e => {
		throw new Error(
			"Exception while parsing selected html strings array" + e ? `:\n ${e}` : ""
		);
	});

	if (!bookLanguage) bookLanguage = "ru";

	// Function for creating a book title
	const getTitle = (index: number) =>
		bookLanguage == "ru" ? `Глава ${index + 1}` : `Chapter ${index + 1}`;

	// Parse chapters to get an array of the contents and the title of each chapter
	const chaptersList = raw_chaptersList
		.map((chapter, index) => {
			const xmlDocument = new DOMParser().parseFromString(chapter, "text/xml"),
				xmlTree = new XmlTree(xmlDocument);
			// Removing garbage elements from a document
			for (const tag of [ "h1", "h2", "head" ])
				xmlTree.select(tag).catch(null).entries(e => (e ? e.remove() : null));

			// Get a list of paragraph elements
			const chapterContents = xmlTree
				.select("section p")
				.catch(null)
				.entries()
				.filter(Boolean) as Element[];

			if (!chapterContents[0]) return String();

			const chapterTextContent: string[] = [];
			let chapterTitle = String();

			// Parse the contents of each paragraph element
			chapterContents.forEach(e => {
				// Remove all links from paragraph content
				new XmlTree(e).select("a").catch(null).entries(e => (e ? e.remove() : null));

				new XmlTree(e).select("emphasis").catch(null).entries(e => {
					if (!e) return;
					const em = document.createElement("em");
					em.innerHTML = e.innerHTML;

					e.replaceWith(em);
				});

				// Check if this paragraph is a title
				let closestParent = e.closest(`[class*="title"]`);
				if (!closestParent) closestParent = e.closest("title");

				if (!chapterTitle && closestParent) chapterTitle = e.innerHTML;
				else chapterTextContent.push(e.innerHTML.trim());
			});

			if (!chapterTitle)
				xmlTree
					.select("section title")
					.catch(null)
					.entry(0, e => (e ? (chapterTitle = e.innerHTML) : null));

			return {
				title: chapterTitle || getTitle(index),
				content: chapterTextContent.map(e => `<p>${e}</p>`).join("")
			} as TBookChapterData;
		})
		.filter(Boolean);

	// Delete empty entries from the array and return it
	return chaptersList.filter(Boolean) as TBookChapterData[];
}

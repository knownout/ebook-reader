import { Base64Image, readXMLFile } from "./utils";
import XmlTree from "./xml-tree";

import { loadAsync } from "jszip";
import { BookParserCore, Book } from "./book-parser-core";

import HtmlParser from "./html-parser";

/**
 * Class for parsing epub, mobi and fb2 books from a file
 */
class Exception {
	public readonly message: string = String();
	constructor (...exception: string[]) {
		this.message = exception.join(" ").trim();
	}
}

export class BookParser extends BookParserCore {
	/**
	 * Load metadata and book chapters asynchronously from a file
	 * @param file the file from which book data will be loaded
	 */
	public async loadBookData (file: File | FileList | null) {
		if (file instanceof FileList) file = file[0];
		if (!file) throw new Error(this.EXCEPTIONS.FILE);

		const extension = file.name.split(".").slice(-1)[0].trim();
		const allowedExtensions = [ "epub", "mobi", "fb2" ];

		if (!allowedExtensions.includes(extension)) throw new Error(this.EXCEPTIONS.EXTENSION);

		if (extension == "fb2") return await this.parse_fb2File(file);
		else if ([ "epub", "mobi" ].includes(extension)) return await this.parse_epubFile(file);

		throw new Error(this.EXCEPTIONS.EXTENSION);
	}

	/**
	 * Parsing files with the epub and mobi extensions
	 * @param file file to be parsed
	 */
	private async parse_epubFile (file: File) {
		const bookData: Partial<Book> = {};

		// Unpacking book files
		const zipFile = await loadAsync(file).catch(() => {
			throw new Error(this.EXCEPTIONS.ARCHIVE);
		});

		const containerFile = zipFile.file("META-INF/container.xml");
		if (!containerFile)
			throw new Exception(this.EXCEPTIONS.EBOOK_INVALID + ":", "container file not found");

		const xmlContainerTree = new XmlTree(await readXMLFile(await containerFile.async("blob")));
		const opfFilePath = xmlContainerTree
			.select(`rootfile[media-type="application/oebps-package+xml"]`)
			.catch(null)
			.attribute("full-path");

		if (!opfFilePath)
			throw new Exception(
				this.EXCEPTIONS.EBOOK_INVALID + ":",
				"rootfile element not found in the container.xml file"
			);

		let rootPath = opfFilePath.replace(/\\/g, "/").split("/").slice(0, -1).join("/");
		if (rootPath.length > 0) rootPath += "/";

		const opfFile = zipFile.file(opfFilePath);

		if (!opfFile)
			throw new Exception(
				this.EXCEPTIONS.EBOOK_INVALID + ":",
				"OPF file not found in the archive"
			);

		const opfXmlTree = new XmlTree(await readXMLFile(await opfFile.async("blob")));

		const manifest: { [key: string]: string } = {};
		opfXmlTree.select("manifest item[href][id]").catch(null).entries(e => {
			const id = e.getAttribute("id"),
				href = e.getAttribute("href");

			if (id && href) manifest[id] = href;
		});

		let releaseDate: string | null = opfXmlTree.tagName("metadata dc:date").catch(null).html();

		if (!releaseDate)
			releaseDate = opfXmlTree
				.select(`meta[name="FB2.book-info.date"][content]`)
				.catch(`meta[name="FB2.document-info.date"][content]`)
				.catch(null)
				.attribute("content");

		const annotation = opfXmlTree.tagName("metadata dc:description").catch(null).html();
		const genres = opfXmlTree
			.tagName("dc:subject")
			.catch(null)
			.entries(e => (e ? e.innerHTML.trim() : ""))
			.filter(Boolean);

		const coverID = opfXmlTree
			.select(`metadata meta[name="cover"][content]`)
			.catch(null)
			.attribute("content");

		let bookCover: null | Base64Image = null;
		if (coverID && manifest[coverID]) {
			const coverFile = zipFile.file(rootPath + manifest[coverID]);
			if (coverFile) bookCover = new Base64Image(await coverFile.async("base64"));
		}

		bookData.metadata = {
			name: opfXmlTree.tagName("metadata dc:title").catch(null).html() || file.name.trim(),
			author: opfXmlTree.tagName("metadata dc:creator").catch(null).html() || null,

			releaseDate: releaseDate ? new Date(releaseDate) : null,
			annotation: annotation ? [ annotation ] : null,

			genres: genres[0] ? genres.map(this.parseGenres) : null,
			keywords: [], // stub
			language: opfXmlTree.tagName("metadata dc:language").catch(null).html() || null,

			cover: bookCover
		};

		const sequence = opfXmlTree
			.select(`meta[name="FB2.book-info.sequence"][content]`)
			.catch(null)
			.attribute("content");

		if (sequence) {
			const parts = sequence.split(";").map(e => e.trim());
			const name = parts[0],
				number = Number(parts[1] || 0);

			bookData.metadata.sequence = { name, number };
		}

		const chapterFilesPath = opfXmlTree
			.select("spine itemref[idref]")
			.catch(null)
			.entries(e => {
				const idref = e.getAttribute("idref");
				if (!idref || idref.includes("cover") || idref.includes("notes")) return String();

				return manifest[idref];
			})
			.filter(Boolean);

		let chaptersList = await Promise.all(
			chapterFilesPath.map(async path => {
				const chapterFile = zipFile.file(rootPath + path);
				if (!chapterFile) return String();

				const xmlChapterFile = new XmlTree(
					await readXMLFile(await chapterFile.async("blob"))
				);

				const root = xmlChapterFile.select("body").catch(null).html();
				if (!root) return String();

				return root;
			})
		);

		chaptersList = chaptersList
			.filter(Boolean)
			.map(e => `<section class="chapter">${e}</section>`);

		bookData.chapters = await HtmlParser(chaptersList, bookData.metadata.language || "ru");
		return bookData as Book;
	}

	/**
	 * Parsing files with the fb2 extension
	 * @param file file to be parsed
	 */
	private async parse_fb2File (file: File) {
		const bookData: Partial<Book> = {};

		// XML document from file
		const xmlDocument = await readXMLFile(file);
		const xmlTree = new XmlTree(xmlDocument);

		/*
			Parsing book metadata elements
		*/
		{
			// Function for selecting part of author name
			const authorNamePart = (selector: string) =>
				xmlTree.select(`title-info author ${selector}`).catch(null).html();

			const authorFullName = [
				authorNamePart("first-name"),
				authorNamePart("nickname"),
				authorNamePart("last-name")
			].filter(Boolean);
			if (authorFullName.length == 3) authorFullName[1] = `"${authorFullName[1]}"`;

			const releaseDate = xmlTree
				.select("title-info date[value]")
				.catch("document-info date[value]")
				.catch(null)
				.attribute("value");

			const annotation = xmlTree
				.select("annotation p")
				.catch("annotation")
				.catch(null)
				.entries(e => e.innerHTML)
				.filter(Boolean);

			const genres = xmlTree
				.select("title-info genre")
				.catch(null)
				.entries(e => e.innerHTML)
				.map(this.parseGenres)
				.filter(Boolean);

			const keywords = xmlTree
				.select("title-info keywords")
				.catch(null)
				.html()
				.split(",")
				.map(this.parseKeywords)
				.filter(Boolean);

			const language = xmlTree
				.select("title-info lang")
				.catch("title-info src-lang")
				.catch(null)
				.html(0, html => (html.includes("ru") ? "ru" : "en"));

			bookData.metadata = {
				name: xmlTree.select("title-info book-title").html(),
				author: authorFullName.join(" ").trim(),

				releaseDate: releaseDate ? new Date(releaseDate) : null,
				annotation: annotation.length > 0 ? annotation : null,

				genres: genres.length > 0 ? genres : null,
				keywords: keywords.length > 0 ? keywords : null,
				language: language || null
			};
		}

		/*
			Parsing book cover
		*/
		const coverHref = xmlTree
			.select("title-info coverpage image")
			.catch(null)
			.attribute("l:href");

		let cover = String();
		if (coverHref && coverHref[0] == "#") {
			const coverElement = xmlDocument.getElementById(coverHref);
			if (coverElement) cover = coverElement.innerHTML;
		} else cover = xmlTree.select(`*[content-type="image/jpeg"]`).catch(null).html();

		if (cover) bookData.metadata.cover = new Base64Image(cover);

		/*
			Parsing book sequence metadata
		*/
		const sequence = xmlTree.select("title-info sequence").catch(null);
		const sequenceName = sequence.attribute("name");

		if (sequenceName) {
			const number = sequence.attribute("number");
			bookData.metadata.sequence = {
				name: sequenceName,
				number: number ? Number(number) : null
			};
		}

		/*
			Parsing the contents of a book as an html string
		*/
		const raw_bookHtmlContent = xmlTree.select("body section").catch(null).entries();
		if (!raw_bookHtmlContent[0]) throw new Error(this.EXCEPTIONS.ELEMENT);

		const bookHtmlContent = raw_bookHtmlContent
			.map(e => (e ? `<section class="chapter">${e.innerHTML}</section>` : null))
			.filter(Boolean) as string[];

		bookData.chapters = await HtmlParser(bookHtmlContent, bookData.metadata.language || "ru");
		return bookData as Book;
	}
}

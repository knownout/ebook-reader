import { Base64Image, readXMLFile } from "./utils";
import XmlTree from "./xml-tree";

interface Book {
	metadata: {
		name: string;
		author: string | null;

		releaseDate: Date | null;
		annotation: string[] | null;

		genres: string[] | null;
		keywords: string[] | null;
		language: string | null;

		cover?: Base64Image | null;
		sequence?: {
			name: string;
			number: number | null;
		};
	};

	chapters: {
		title: string;
		content: string;
	}[];
}

export class BookParser {
	private readonly EXCEPTIONS = {
		FILE: "Exception while parsing selected file",
		EXTENSION: "Selected file extension not allowed"
	};

	/**
	 * Load metadata and book chapters asynchronously from a file
	 * @param file the file from which book data will be loaded
	 */
	public async loadBookData (file: File | FileList | null) {
		if (file instanceof FileList) file = file[0];
		if (!file) throw new Error(this.EXCEPTIONS.FILE);

		const filename = file.name.split(".").map(e => e.trim());

		const extension = filename.slice(-1)[0],
			name = filename.slice(0, -1).join(".").trim();

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
	private async parse_epubFile (file: File) {}

	/**
	 * Parsing files with the fb2 extension
	 * @param file file to be parsed
	 */
	private async parse_fb2File (file: File) {
		const bookData: Partial<Book> = {};

		// XML document from file
		const xmlDocument = await readXMLFile(file);
		const xmlTree = new XmlTree(xmlDocument);

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
			.entries(null, e => e.innerHTML)
			.filter(Boolean);

		const genres = xmlTree
			.select("title-info genre")
			.catch(null)
			.entries(null, e => e.innerHTML)
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

		return bookData as Book;
	}

	/**
	 * Method for parsing a book genres
	 * @param genre raw genre string
	 */
	private parseGenres (genre: string) {
		// Suffixes of the genre to be removed
		const excludeSuffixes = [ "sf_" ];

		excludeSuffixes.forEach(suffix => (genre = genre.replace(new RegExp(suffix, "g"), "")));

		genre = genre.trim().toLowerCase();

		genre = genre.replace(/\_/g, " ").replace(/\s{2,}/, " ");
		genre = genre[0].toUpperCase() + genre.slice(1);

		return genre;
	}

	private parseKeywords (keyword: string) {
		// Keywords that must be removed from keywords list
		const excludeKeywords = [ "самиздат" ];
		if (!keyword) return keyword;

		// Keywords replacement
		const replaceKeywords = {
			litrpg: "ЛитРПГ"
		};

		keyword = keyword.trim().toLowerCase();

		if (excludeKeywords.includes(keyword)) return String();
		Object.keys(replaceKeywords).forEach(key => {
			if (keyword.includes(key)) keyword = (replaceKeywords as any)[key];
		});

		keyword = keyword.replace(/\_/g, " ").replace(/\s{2,}/, " ");
		keyword = keyword[0].toUpperCase() + keyword.slice(1);

		return keyword;
	}
}

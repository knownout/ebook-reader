import BookParserCore from "./book-parser-core";
import { loadAsync } from "jszip";

export interface Book {
	metadata: {
		author: string;
		annotation: string[];
		title: string;
		releaseDate: Date;
		language: "ru" | "en";
		keywords: string[];
		genres: string[];
		cover: string;
	};

	content: {
		title: string;
		text: React.ReactElement[];
	}[];
}

export default class BookParser extends BookParserCore {
	private bookText?: Promise<string>;

	private name?: string;
	private extension?: string;

	/**
	 * Get book metadata asynchronously
     * @param file book file
	 */
	async loadBookData (file: File | FileList | null) {
		// Check if the file is readable
		if (file == null) throw new Error(this.EXCEPTIONS.FILE);
		if (file instanceof FileList) file = file[0];

		if (!file) throw new Error(this.EXCEPTIONS.FILE);

		// List of extensions that can be processed
		const allowedExtensions = [ "fb2", "epub", "mobi" ];

		this.extension = file.name.split(".").slice(-1)[0].toLowerCase();
		this.name = file.name.split(".").slice(0, -1).join(".");

		// Check if file extension is allowed
		if (!allowedExtensions.includes(this.extension))
			throw new Error(this.EXCEPTIONS.EXTENSION);

		// Check if the file is empty
		if (file.size < 10) throw new Error(this.EXCEPTIONS.FILE);

		// Parse the file by its extension
		if ([ "epub", "mobi" ].includes(this.extension)) return await this.parse_epubFile(file);
		if (this.extension == "fb2") return await this.parse_fb2File(file);

		throw new Error(this.EXCEPTIONS.FILE);
	}

	private async parse_epubFile (file: File) {
		// Unzip selected book file
		const zipFile = await loadAsync(file).catch(() => {
			throw new Error(this.EXCEPTIONS.ARCHIVE);
		});

		const contentFilePath = Object.keys(zipFile.files).reduce(
			(acc, e) => (e.includes("content.opf") ? e : acc || null),
			null as null | string
		);

		if (!contentFilePath) throw new Error(this.EXCEPTIONS.ELEMENT_NOT_FOUND);

		const filePath = contentFilePath.replace("\\\\g", "/").split("/");
		const contentFileName = filePath.slice(-1)[0].trim();
		const rootDirPath = filePath.slice(0, -1).join("/");

		// Book metadata and content object
		const bookContent: Partial<Book> = {};

		// parse XML document from file content
		const XMLContentFile = new DOMParser().parseFromString(
			await zipFile.files[`${rootDirPath}/${contentFileName}`].async("text"),
			"text/xml"
		);

		// Parsing book metadata
		await new Promise(resolve => {
			this.selectElement(XMLContentFile, "metadata").entry(async titleInfo => {
				// Shortcut for selectElement method
				const select = (selector: string) => this.selectElement(titleInfo, selector);

				// Language of the book
				const language = select("dc:language").html(null, "ru").toLowerCase();

				// Get path of the book cover
				const coverFilePath = this.selectElement(XMLContentFile, `reference[type="cover"]`)
					.entry()
					.getAttribute("href") as string;

				// Check if the image file exist
				if (!zipFile.files[`${rootDirPath}/${coverFilePath}`])
					throw new Error(this.EXCEPTIONS.ARCHIVE_FILE);

				// Read image file as base64 string
				const coverImage = await zipFile.files[`${rootDirPath}/${coverFilePath}`]
					.async("base64")
					.catch(() => {
						throw new Error(this.EXCEPTIONS.ARCHIVE_FILE);
					});

				bookContent.metadata = {
					author: select("dc:creator").html(),
					annotation: [ select("dc:description").html() ],

					title: select("dc:title").html(),
					releaseDate: new Date(select(`meta[name="FB2.book-info.date"]`)
						.entry()
						.getAttribute("content") as string),

					language: language.includes("ru") ? "ru" : "en",

					keywords: [],
					genres: [],
					cover: this.parseImageBase64(coverImage)
				};

				this.language = bookContent.metadata.language;
				resolve();
			});
		});

		// Check if metadata has written
		if (!bookContent.metadata) throw new Error(this.EXCEPTIONS.DATA_CORRUPTED);

		// Find path to the toc file in selected unpacked file
		let tocFilePath;

		try {
			tocFilePath = (XMLContentFile.querySelector(
				`#${(XMLContentFile.querySelector("spine") as Element).getAttribute("toc")}`
			) as Element).getAttribute("href") as string;
		} catch (e) {
			throw new Error(this.EXCEPTIONS.ELEMENT_NOT_FOUND);
		}

		// Check if toc file path written
		if (!tocFilePath) throw new Error(this.EXCEPTIONS.ELEMENT_NOT_FOUND);

		// Check if toc file exist
		if (!zipFile.files[`${rootDirPath}/${tocFilePath}`])
			throw new Error(this.EXCEPTIONS.ARCHIVE_FILE);

		// Parse toc file as xml document
		const tocFile = new DOMParser()
			.parseFromString(
				await zipFile.files[`${rootDirPath}/${tocFilePath}`].async("text").catch(() => {
					throw new Error(this.EXCEPTIONS.ELEMENT_NOT_FOUND);
				}),
				"text/xml"
			)
			.querySelector("navMap") as Element;

		// Check if toc file contains navMap element
		if (!tocFile) throw new Error(this.EXCEPTIONS.ELEMENT_NOT_FOUND);

		// Get chapters list from navMap element of the toc file
		const chaptersList = this.selectElement(tocFile, "navPoint")
			.entries()
			.map(point => {
				const playOrder = Number(point.getAttribute("playOrder"));

				// Path to the chapter xhtml file
				const filePath = this.selectElement(point, "content[src]")
					.entry()
					.getAttribute("src") as string;

				return [ filePath, playOrder ] as [string, number];
			})
			// Sort chapters list by play order
			.sort((a, b) => {
				const playOrderA = a[1],
					playOrderB = b[1];

				if (playOrderA > playOrderB) return 1;
				else if (playOrderA < playOrderB) return -1;
				return 0;
			});

		// Get content from every chapter xhtml file
		const chaptersContentList = chaptersList.map(async chapter => {
			const path = chapter[0].split("#");

			// Path to the xhtml file in selected unpacked file
			const pathName = path[0],
				// ID of the every chapter in xhtml file
				pathID = path[1];

			// Parse xhtml file as xml document and find chapter content by id
			const chapterFile = new DOMParser()
				.parseFromString(
					await zipFile.files[`${rootDirPath}/${pathName}`].async("text").catch(() => {
						throw new Error(this.EXCEPTIONS.ARCHIVE_FILE);
					}),
					"text/xml"
				)
				.querySelector(`#${pathID}`) as Element;

			// Check if chapter content found
			if (!chapterFile) throw new Error(this.EXCEPTIONS.ELEMENT_NOT_FOUND);
			return chapterFile.innerHTML;
		});

		const parser = new DOMParser();

		// Container for all chapters elements
		const bookElement = document.createElement("div") as Element;

		// Wrap chapters to a section tag and append to the bookElement
		(await Promise.all(chaptersContentList))
			.map(e => `<section>${e}</section>`)
			.map(e => parser.parseFromString(e, "text/xml"))
			.forEach(e => bookElement.append(e.querySelector("section") as Element));

		// Parsing book content by chapters
		bookContent.content = this.parseBookContent(bookElement, "section", "p");

		if (!bookContent.content) throw new Error(this.EXCEPTIONS.DATA_CORRUPTED);
		return bookContent as Book;
	}

	private async parse_fb2File (file: File) {
		this.bookText = file.text();

		// Content of the given book file
		const bookText = await this.bookText;

		// Book metadata and content object
		const bookContent: Partial<Book> = {};

		// parse XML document from file content
		const XMLDocument = new DOMParser().parseFromString(bookText, "text/xml");

		// Parsing book metadata
		this.selectElement(XMLDocument, "description title-info").entry(titleInfo => {
			// Shortcut for selectElement method
			const select = (selector: string) => this.selectElement(titleInfo, selector);

			// Language of the book
			const language = select("lang").html(null, "ru").toLowerCase();

			bookContent.metadata = {
				author:
					select("author first-name").html() + " " + select("author last-name").html(),
				annotation: select("annotation p")
					.except(() => [ select("annotation").entry() ])
					.entries()
					.map(this.parseHTML),

				title: select("book-title").html(null, this.name),
				releaseDate: new Date(select("date").entry().getAttribute("value") as string),

				language: language.includes("ru") ? "ru" : "en",
				genres: select("genre").entries().map(this.parseHTML).map(this.parseGenres),

				keywords: select("keywords")
					.html()
					.split(",")
					.map(this.parseKeywords)
					.filter(Boolean),

				cover: this.parseImageBase64(
					this.selectElement(XMLDocument, `binary[content-type^="image/"]`).html()
				)
			};

			this.language = bookContent.metadata.language;
		});

		// Parsing book content by chapters
		bookContent.content = this.parseBookContent(XMLDocument, "body section", "p");
		return bookContent as Book;
	}
}

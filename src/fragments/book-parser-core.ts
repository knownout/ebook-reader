import ReactHTMLParser from "react-html-parser";
export default class BookParserCore {
	// Exception messages list
	protected readonly EXCEPTIONS = {
		FILE: "Exception while processing selected file",
		ELEMENT_NOT_FOUND: "Required element not found at the book xml document",
		EXTENSION: "Selected file extension not supported",
		ARCHIVE:
			"The selected file supposed be an archive, but the parser cannot unpack this file",
		ARCHIVE_FILE: "Required file not found in unpacked selected file",
		DATA_CORRUPTED:
			"Exception while processing selected file, part of the required data was corrupted"
	};

	// Translations for auto-generated text
	protected readonly TRANSLATION = {
		ru: {
			chapter: "Глава"
		},

		en: {
			chapter: "Chapter"
		}
	};

	protected language?: "ru" | "en";

	protected parseBookContent (xml: Document | Element, chapterTag: string, itemTag: string) {
		const bookContent: {
			title: string;
			text: React.ReactElement[];
		}[] = [];

		// Parsing book content by chapters
		this.selectElement(xml, chapterTag).entries(sections => {
			// Parsing every chapter and writing as title and text
			sections.forEach((section, index) => {
				let title = String();
				let text = String();

				// Processing every paragraph of given section
				this.selectElement(section, itemTag).entries().forEach(paragraph => {
					// If current paragraph parent node is title, rewrite chapter title data
					if (
						paragraph.parentElement &&
						(paragraph.parentElement.tagName.toLowerCase().includes("title") ||
							paragraph.parentElement.className.toLowerCase().includes("title"))
					)
						title = this.parseHTML(paragraph);
					else
						// ... if not, write this paragraph as chapter content
						text += `<p>${this.parseHTML(paragraph)}</p>`;
				});

				// If there is no title in this section, generate title with current section index
				if (title.length < 1)
					title = this.TRANSLATION[this.language || "ru"].chapter + ` ${index + 1}`;

				const replaceTags = { strong: "b", emphasis: "i" };
				Object.keys(replaceTags).forEach(key => {
					[ "<", "</" ].forEach(leftside => {
						text = text.replace(
							RegExp(leftside + key, "g"),
							leftside + (replaceTags as any)[key]
						);
					});
				});

				// Push chapter to the chapters list
				if (bookContent) bookContent.push({ title, text: ReactHTMLParser(text) });
			});
		});

		return bookContent;
	}

	/**
	 * Method for selecting elements from parent nodes and process it as array entries
	 * @param parent parent node
	 * @param selector searching element selector
	 */
	protected selectElement (parent: Element | Document, selector: string) {
		// Find element in parent node

		let elements: Element[] = [];
		try {
			elements = Array.from(parent.querySelectorAll(selector));
		} catch (e) {
			elements = Array.from(parent.getElementsByTagName(selector));
		}

		let error: boolean = false;

		// If element not found, throw exception
		if (!elements || elements.length < 1) error = true;

		const self = this;
		return {
			/**
			 * Replaces elements array if it cannot be processed
			 * @param replace element or elements array for replacement
			 */
			except (replace: () => Element[] | Element) {
				if (error) {
					elements = [ replace() ].flat();
					error = false;
				}

				return this;
			},

			/**
			 * Get one entry from found elements array
			 * @param fn element processing function
			 */
			entry (fn?: (element: Element) => void) {
				const entry = this.entries()[0];

				// If processing function defined, call it
				if (fn) fn(entry);
				return entry;
			},

			/**
			 * Get all found entries from elements array
			 * @param fn elements processing function
			 */
			entries (fn?: (elements: Element[]) => void) {
				if (error) throw new Error(self.EXCEPTIONS.ELEMENT_NOT_FOUND);

				// If processing function defined, call it
				if (fn) fn(elements);
				return elements;
			},

			/**
			 * Get html of first entry from elements array
			 * @param fn html as string processing function
			 */
			html (fn?: ((html: string) => void) | null, replace?: string) {
				let html = String();

				if (error && replace) html = replace;
				else if (error) throw new Error(self.EXCEPTIONS.ELEMENT_NOT_FOUND);

				// Get element html as string
				html = elements[0].innerHTML.replace(/\r|\n/g, "").trim();
				if (fn) fn(html);

				return html;
			}
		};
	}

	/**
	 * Method for usage inside Array.map function, parses html from Element
	 * @param element element for parsing
	 */
	protected parseHTML = (element: Element) => element.innerHTML.replace(/\r|\n/g, "").trim();

	/**
	 * Method for parsing genres of the book
	 * @param genre genre as string
	 */
	protected parseGenres (genre: string) {
		// Suffixes that can contain genres from online books
		const excludeSuffixes = [ "sf_" ];

		// Removing excluded suffixes
		excludeSuffixes.forEach(suffix => (genre = genre.replace(new RegExp(suffix, "g"), "")));

		genre = genre.trim().toLowerCase();
		genre = genre[0].toUpperCase() + genre.slice(1);

		return genre;
	}

	/**
	 * Method for parsing keywords of the book
	 * @param keyword keyword as string
	 */
	protected parseKeywords (keyword: string) {
		// Keywords that must be removed from keywords list
		const excludeKeywords = [ "самиздат" ];

		// Keywords replacement
		const replaceKeywords = {
			litrpg: "ЛитРПГ"
		};

		keyword = keyword.trim().toLowerCase();

		if (excludeKeywords.includes(keyword)) return String();
		Object.keys(replaceKeywords).forEach(key => {
			if (keyword.includes(key)) keyword = (replaceKeywords as any)[key];
		});

		keyword = keyword[0].toUpperCase() + keyword.slice(1);

		return keyword;
	}

	/**
     * Method for parsing image base64
     * @param base64 base64 string
     */
	protected parseImageBase64 (base64: string) {
		if (base64.slice(0, 10) == "data:image") return base64;
		return "data:image/jpeg;base64," + base64;
	}
}

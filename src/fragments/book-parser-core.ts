import { Base64Image } from "./utils";

/**
 * Core of the class for parsing epub, mobi and fb2 books from a file
 */
export default class BookParserCore {
	protected readonly EXCEPTIONS = {
		FILE: "Exception while parsing selected file",
		EXTENSION: "Selected file extension not allowed",
		ARCHIVE: "Exception while unpacking archive",
		ARCHIVE_FILE: "Required file not found in unpacked archive",
		ELEMENT: "Required element not found in the xml document",
		EBOOK_INVALID: "Selected book is invalid"
	};

	/**
	 * Method for parsing a book genres
	 * @param genre raw genre string
	 */
	protected parseGenres (genre: string) {
		// Suffixes of the genre to be removed
		const excludeSuffixes = [ "sf_" ];

		excludeSuffixes.forEach(suffix => (genre = genre.replace(new RegExp(suffix, "g"), "")));

		genre = genre.trim().toLowerCase();

		genre = genre.replace(/\_/g, " ").replace(/\s{2,}/, " ");
		genre = genre[0].toUpperCase() + genre.slice(1);

		return genre;
	}

	/**
	 * Method for parsing a book keywords
	 * @param keyword 
	 */
	protected parseKeywords (keyword: string) {
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

export type TBookChapterData = { title: string; content: string };
export interface Book {
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

	chapters: TBookChapterData[];
}

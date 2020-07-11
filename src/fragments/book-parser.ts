import React from "react";
import { Base64Image } from "./utils";

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

	private async parse_epubFile (file: File) {}
	private async parse_fb2File (file: File) {}
}

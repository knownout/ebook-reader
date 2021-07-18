import JSZip from "jszip";
import { CompressedXMLFileOpenException } from "./libs/exceptions";
import { getCleanText, TNCXChapterData } from "./libs/utils";
import $ from "./libs/xmltool";

export default class BookParserCore {
	protected readonly zipFile: Promise<JSZip>;
	private readonly defaultMetaPath = "META-INF/container.xml";

	protected constructor (zipFile: Promise<JSZip>) {
		this.zipFile = zipFile;
	}

	/**
     * Local function to open XML files as a DOM tree from a specific zip archive
     * @param zipFile JSZip instance
     * @param path the path to the file inside the JSZip instance
     * @returns DOM tree of the selected file
     * @throws CompressedXMLFileOpenException if file does not exist or is corrupted
     */
	protected async openCompressedXMLFile (zipFile: JSZip, path: string) {
		const file = zipFile.file(path);

		if (!file) throw new CompressedXMLFileOpenException();
		return new DOMParser().parseFromString(await file.async("text"), "application/xml");
	}

	/**
     * Method for processing the main e-book metadata file
     * @returns path to the e-book content file
     */
	protected async processContainerFile () {
		const zipFile = await this.zipFile,
			container = await this.openCompressedXMLFile(zipFile, this.defaultMetaPath);

		return $(container.querySelector("container")).find(`rootfile`)[0].attribute("full-path");
	}

	/**
     * Method for processing the main e-book content file
     * @param path the location of the e-book content file (can be obtained from processContainerFile method)
     */
	protected async processContentFile (path: string) {
		const zipFile = await this.zipFile,
			content = await this.openCompressedXMLFile(zipFile, path);

		// Main elements of the content file
		const [ metadata, manifest, spine ] = $(content.querySelector("package")).find("metadata", "manifest", "spine");

		// Title of the e-book
		const title = getCleanText(metadata.find("title")[0].obj.innerHTML);

		// Additional e-book data, may be blank
		const description = getCleanText(metadata.search("description")[0].obj.innerHTML),
			author = metadata.search("creator").map(e => getCleanText(e.obj.innerHTML)),
			coverPath = metadata.search(`meta[name="cover"]`)[0].attribute("content");

		// Get manifest data as a dictionary of identifiers and links
		const manifestDataDict: { [key: string]: string } = {};
		Array.from(manifest.obj.children)
			.map(e => $(e))
			.forEach(child => (manifestDataDict[child.attribute("id")] = child.attribute("href")));

		// Retrieving page order from spine and manifest objects
		const bookDataOrder: string[] = [];
		Array.from(spine.obj.children)
			.map(e => $(e))
			.forEach(child => bookDataOrder.push(manifestDataDict[child.attribute("idref")]));

		// Unzip the cover image with the path from the manifest, if that path exists
		let coverImage = manifestDataDict[coverPath];
		if (coverImage) {
			const coverImageFile = zipFile.file(coverImage);
			if (coverImageFile) coverImage = await coverImageFile.async("base64");
			else coverImage = "";
		}

		// Represent metadata as a dictionary
		const metadataObject = { title, description, author, cover: coverImage };

		return {
			metadata: metadataObject,
			bookDataOrder,
			ncxChapterDataFile: manifestDataDict["ncx"]
		};
	}

	/**
     * Method for processing the e-book ncx chapters data file
     * @param path location of the ncx file
     * @returns ncx file data
     */
	protected async processNCXChapterDataFile (path: string): Promise<TNCXChapterData[]> {
		const zipFile = await this.zipFile;

		const nxcFile = await this.openCompressedXMLFile(zipFile, path);
		const navPointsList = $(nxcFile.querySelector("navMap")).find("navPoint");

		let ncxChaptersData: TNCXChapterData[] = [];

		navPointsList.forEach(navPoint => {
			const playOrder = Number.parseInt(navPoint.attribute("playOrder"));
			const text = getCleanText(navPoint.find("navLabel")[0].obj.innerHTML);

			const fileLocation = navPoint.find("content")[0].attribute("src");
			ncxChaptersData.push({ playOrder, text, fileLocation });
		});

		ncxChaptersData = ncxChaptersData.sort((a, b) => (a.playOrder > b.playOrder ? 1 : -1));
		return ncxChaptersData;
	}
}

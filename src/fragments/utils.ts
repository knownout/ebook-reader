import XmlTree from "./xml-tree";

/**
 * Function for reading XML files with automatic encoding selection
 * @param file file from which data will be read
 * @param encoding encoding for the first iteration
 */
async function readXMLFile (file: Blob, encoding = "UTF-8") {
	const reader = new FileReader(),
		parser = new DOMParser(),
		xmlTree = new XmlTree();

	const readWithEncoding = async (encoding: string) => {
		reader.readAsText(file, encoding);
		return parser.parseFromString(
			await new Promise(r => (reader.onload = () => r(reader.result as string))),
			"text/xml"
		);
	};

	let xmlDocument = await readWithEncoding(encoding);
	if ("xmlEncoding" in xmlDocument) {
		const xmlEncoding = (xmlDocument as any).xmlEncoding;
		if (xmlEncoding && xmlEncoding.toLowerCase() != encoding.toLowerCase())
			xmlDocument = await readWithEncoding(xmlEncoding);
	}

	return xmlDocument;
}
class Base64Image {
	public readonly imageType: string = "jpeg";
	public readonly base64: string;

	constructor (base64: string) {
		base64 = base64.replace(/\r|\n/g, "").trim();

		if (base64.slice(0, 10) == "data:image") {
			this.base64 = base64;
			this.imageType = base64.slice(0, 16).split(";")[0].split("/").slice(-1)[0];
		} else this.base64 = `data:image/jpeg;base64,${base64}`;
	}

	imageURL = () => `url("${this.base64}")`;
	styleObject = () => ({ backgroundImage: this.imageURL() } as React.CSSProperties);
}

export { Base64Image, readXMLFile };

import { Base64Image, readXMLFile } from "../utils";
import XmlTree from "../xml-tree";

const blob = new Blob(
	[
		`
    <section>
        <div class="_title">
            <p>Chapter title</p>
        </div>
        <p class="content">Chapter content</p>
    </section>
`
	],
	{ type: "text/xml" }
);

describe("Utils functions testing", () => {
	it("readXMLFile function test", async () => {
		const xmlDocument = await readXMLFile(blob);
		const xmlTree = new XmlTree(xmlDocument);

		expect(xmlTree.select("div._title p").html()).toEqual("Chapter title");
	});

	it("Base64Image class test", () => {
		const imageData = `data:image/png;base64,/9j/a342gvv4gh3`;
		const base64image = new Base64Image(imageData);

		expect((base64image.styleObject() as any)["backgroundImage"].slice(0, 3)).toEqual("url");
		expect(base64image.base64).toEqual(imageData);
		expect(base64image.imageType).toEqual("png");
		expect(base64image.imageURL().slice(0, 3)).toEqual("url");
	});
});

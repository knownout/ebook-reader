import XmlTree from "../xml-tree";
import { EPERM } from "constants";

const htmlData = new DOMParser().parseFromString(
	`
    <body>
        <section>
            <div class="_title">
                <p>Chapter title</p>
            </div>
            <p class="content">Chapter content</p>
        </section>
        <data attr="test">  content </data>
    </body>
`,
	"text/xml"
);

describe("XmlTree functionality testing", () => {
	const xmlTree = new XmlTree(htmlData);
	const content = xmlTree.tagName("data"),
		html = content.html(),
		attr = content.attribute("attr");

	it("Elements selecting test", () => {
		const bodyElement = xmlTree.select("body").catch(null);
		const tagName = (el: Element | null) => (el ? el.tagName.toLowerCase() : String());

		expect(tagName(bodyElement.entries()[0])).toEqual("body");
		expect(tagName(bodyElement.entry())).toEqual("body");
	});

	it("Exceptions catching functionality test", () => {
		const element = xmlTree.select("undefined-element").catch(null);

		expect(element.entries()[0]).toBeNull();
		expect(element.entries().length).toEqual(1);

		expect(element.entry()).toBeNull();
	});

	it("Output modification test", () => {
		const title = xmlTree.select("div._title p");

		expect(title.entries(e => e.innerHTML)[0]).toEqual("Chapter title");
		expect(title.entry(0, e => e.innerHTML)).toEqual("Chapter title");
	});

	it("Selecting by tagName test", () => expect(html).toEqual("content"));
	it("Attributes selecting test", () => expect(attr).toEqual("test"));
});

import HtmlParser from "../html-parser";
import { shallow } from "enzyme";

import ReactHTMLParser from "react-html-parser";

const htmlString = `
    <body>
        <section>
            <div class="_title">
                <p><emphasis>Chapter title</emphasis></p>
            </div>
            <p>Chapter content</p>
        </section>
    </body>
`;

const parsingResult = HtmlParser([ htmlString ]);
it("HtmlParser functionality test", async () => {
	const book = await parsingResult;

	const firstTitle = shallow(ReactHTMLParser(book[0].title)[0]),
		firstContent = shallow(ReactHTMLParser(book[0].content)[0]);

	expect(firstContent.text()).toEqual("Chapter content");
	expect(firstTitle.text()).toEqual("Chapter title");
});

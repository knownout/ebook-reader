import $ from "../xmltool";

describe("XMLTool functionality test", () => {
	const testSpace = document.createElement("div");
	const innerElement = document.createElement("span");
	innerElement.setAttribute("ns-data", "value-0");
	innerElement.setAttribute("id", "zero");
	innerElement.innerHTML = "inner-text";

	testSpace.appendChild(innerElement);

	const object = $(testSpace);
	it("Element wrapping test", () => {
		[ "attribute", "find", "search", "obj" ].forEach(item => {
			expect(item in object).toBeTruthy();
		});
	});

	it("Search function test", () => {
		expect(!object.find("span")).toBeFalsy();
		expect(!object.find("span#zero")).toBeFalsy();
		expect(!object.find("#zero")).toBeFalsy();

		expect(object.find("span#zero").length).toEqual(1);
		expect(object.find("span#zero")[0].obj).toBeInstanceOf(HTMLElement);

		try {
			object.find("div");
		} catch (error) {
			expect(error.message).toEqual("Exception when trying to find element in dom tree");
		}
	});

	const item = object.find("span")[0];
	it("Element attribute reading test", () => {
		expect(item.attribute("ns-data")).toEqual("value-0");
		expect(item.obj.innerHTML).toEqual("inner-text");
		expect(item.attribute("id")).toEqual("zero");
	});

	it("Element attribute writing test", () => {
		expect(item.attribute("ns-data", "value-1").attribute("ns-data")).toEqual("value-1");
	});
});

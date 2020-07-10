/**
 * Function for fast selecting elements from XML documents
 * @param selector selector of the element
 */
function selectElement (selector: string) {
	// Parent element for querySelector method
	let parent: Document | Element = document;

	// Is exception while selecting elements
	let exception = false;

	// List of selected elements
	let elements = Array.from(parent.querySelectorAll(selector));

	// Exception if elements list not defined or empty
	if (!elements || elements.length < 1) exception = true;

	type ModifyFunction = ((entry: Element) => Element | null) | null;
	const methods = {
		/**
		 * Method for replacing default parent by custom element
		 * @param parentElement custom parent element
		 */
		parent (parentElement: Element) {
			elements = Array.from(parentElement.querySelectorAll(selector));

			exception = false;
			if (!elements || elements.length < 1) exception = true;

			parent = parentElement;
			return this;
		},

		/**
		 * Method for element searching by tag name, not by selector
		 * @param tagName 
		 */
		tagName (tagName: string) {
			elements = Array.from(parent.getElementsByTagName(tagName));

			exception = false;
			if (!elements || elements.length < 1) exception = true;

			return this;
		},

		/**
		 * Method for replacing elements list if there are exception while selecting element
		 * @param replacer elements for replace or function
		 */
		catch (
			replacer:
				| ((e: Element[], parent: Element | Document) => Element | Element[])
				| Element
				| Element[]
				| string
		) {
			if (!exception) return this;

			if (typeof replacer == "function") {
				const execResult = replacer(elements, parent);

				if (execResult) elements = [ ...execResult ].flat();
				else return this;
			} else {
				if (typeof replacer == "string")
					elements = Array.from(parent.querySelectorAll(replacer));
				else if (!Array.isArray(replacer)) elements = [ replacer ];
				else elements = replacer;
			}

			if (elements && elements.length > 0) exception = false;
			return this;
		},

		/**
		 * Method for selecting one element from selected elements list
		 * @param modify function for modifying selected element
		 * @param index element index in elements list array
		 */
		entry (modify?: ModifyFunction, index: number = 0) {
			return this.entries(modify)[index];
		},

		/**
		 * Method for selecting all elements from selected elements list
		 * @param modify function for modifying each element in list
		 */
		entries (modify?: ModifyFunction) {
			if (exception) throw new Error("Uncaught exception while selecting elements");

			let entries = Array.from(elements);

			if (modify) {
				entries = entries.map(entry => {
					let modified = modify(entry);
					if (modified) return modified;

					exception = true;
					return entry;
				});
			}

			return entries;
		},

		/**
		 * Method for selecting html of first 
		 * @param options.modify function for modifying selected element
		 * @param options.modifyHTML function for modifying selected html of the element
		 * @param options.index index of the element in the selected elements array
		 */
		html (options?: {
			modify?: ModifyFunction;
			modifyHTML?: ((html: string) => string) | null;
			index?: number;
		}) {
			const entry = this.entry(
				options ? options.modify : null,
				options ? options.index || 0 : 0
			);
			let html = entry.innerHTML;

			if (options && options.modifyHTML) html = options.modifyHTML(html);
			return html
				.replace(/\r|\n/g, "")
				.replace(/\n{3,}/g, "\n\n")
				.replace(/\s{2,}/g, " ")
				.trim();
		}
	};

	return methods;
}

class Base64Image {
	public readonly imageType: string = "jpeg";
	public readonly base64: string;

	constructor (base64: string) {
		if (base64.slice(0, 10) == "data:image") {
			this.base64 = base64;
			this.imageType = base64.slice(0, 16).split(";")[0].split("/").slice(-1)[0];
		} else this.base64 = `data:image/jpeg;base64,${base64}`;
	}

	imageURL = () => `url("${this.base64}")`;
	styleObject = () => ({ backgroundImage: this.imageURL() } as React.CSSProperties);
}

export { selectElement, Base64Image };

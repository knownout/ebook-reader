/**
 * Types for XmlTree functions and modified output
 */
namespace XmlTreeFunctions {
	export type ModifyFunction = ((entry: Element) => Element | null) | null;

	export type ModifyTextFunction = (html: string) => string;
	export type ReplacerFunction = ((
		e: Element[],
		parent: Element | Document
	) => Element | Element[]);
}

/**
 * Class for selecting and modifying elements from XML documents
 */
export default class XmlTree {
	private exception = false;
	private elements: Element[] | null = null;
	private selector = "*";

	/**
	 * @param parentElement custom parent element in which elements are selected
	 */
	constructor (private parentElement: Element | Document = document) {}

	/**
	 * Method for selecting elements in XML documents using querySelectorAll function
	 * @param selector selector for querySelectorAll function
	 */
	select (selector: string) {
		this.elements = Array.from(this.parentElement.querySelectorAll(selector));
		this.selector = selector;

		if (!this.elements || this.elements.length < 1) this.exception = true;
		return this;
	}

	/**
	 * Method for replacing parent element with new one
	 * @param parent new parent element
	 */
	parent (parent: Element | Document) {
		this.parentElement = parent;
		this.elements = Array.from(parent.querySelectorAll(this.selector));
		this.exception = false;

		if (!this.elements || this.elements.length < 1) this.exception = true;
		return this;
	}

	/**
	 * Method for selecting elements in XML documents using getElementsByTagName function
	 * @param tagName tag name for elements selecting
	 */
	tagName (tagName: string) {
		this.elements = Array.from(this.parentElement.getElementsByTagName(tagName));
		this.exception = false;

		if (!this.elements || this.elements.length < 1) this.exception = true;
		return this;
	}

	/**
	 * Replace the list of elements with a replacer if an uncaught 
	 * exception is found when selecting elements
	 * @param replacer function that returns an element or an array of elements that 
	 * will replace the list of elements
	 */
	catch (replacer: XmlTreeFunctions.ReplacerFunction): this;

	/**
	 * Replace the list of elements with a replacer if an uncaught exception 
	 * is found when selecting elements
	 * @param replacer element that will replace the list of elements
	 */
	catch (replacer: Element): this;

	/**
	 * Replace the list of elements with a replacer if an uncaught exception 
	 * is found when selecting elements
	 * @param replacer elements array that will replace the list of elements
	 */
	catch (replacer: Element[]): this;

	/**
	 * Replace the list of elements with a replacer if an uncaught exception 
	 * is found when selecting elements
	 * @param replacer a string for the querySelectorAll function, the result of which 
	 * will replace the list of elements
	 */
	catch (replacer: string): this;

	/**
	 * Replace the list of elements with a replacer if an uncaught exception is
	 * found when selecting elements
	 * @param replacer null
	 * 
	 * When an null value is used as a replacer, the entry method will always return a null 
	 * value, just as the entries method will return [null]
	 */
	catch (replacer: null): this;
	catch (replacer: XmlTreeFunctions.ReplacerFunction | Element | Element[] | string | null) {
		// If there is no unhandled exception, do not execute this catch method
		if (!this.exception) return this;

		// If replacer is a function, execute it and replace the list of
		// elements with the result of execution.
		if (typeof replacer == "function") {
			const execResult = replacer(this.elements || [], this.parentElement);

			if (execResult) this.elements = [ ...execResult ].flat();
			else return this;
		} else {
			// If replacer is a string, call the querySelectorAll function, the result
			// of which will replace the list of elements
			if (typeof replacer == "string")
				this.elements = Array.from(this.parentElement.querySelectorAll(replacer));
			else if (replacer !== null && !Array.isArray(replacer))
				this.elements = replacer ? [ replacer ] : null;
			else this.elements = replacer; // Otherwise, use the replacer as is or as an array.
		}

		// If replacer is null or the list of elements exists and contains at least one
		// element, suppress this exception
		if (replacer === null || (this.elements && this.elements.length > 0))
			this.exception = false;

		return this;
	}

	/**
	 * Method for getting an array of items from a list
	 */
	entries (): (Element | null)[];

	/**
	 * Method for getting an array of items from a list
	 * @param modify function to modify each entry of the returned array
	 */
	entries (modify: XmlTreeFunctions.ModifyFunction): (Element | null)[];

	/**
	 * Method for getting an array of items from a list
	 * @param modify function to modify each entry of the returned array
     * @param modifyOutput function to change each item of a list
	 */
	entries<U> (
		modify: XmlTreeFunctions.ModifyFunction,
		modifyOutput?: (entry: Element) => U
	): U[];

	entries<U> (modify?: XmlTreeFunctions.ModifyFunction, modifyOutput?: (entry: Element) => U) {
		// If there is an unhandled exception, throw an error
		if (this.exception) throw new Error("Uncaught exception while selecting elements");

		// If the list of items is null, return an array with a null value
		if (this.elements === null) return [ null ];
		let entries = Array.from(this.elements);

		// If a modification function is provided, use it as an argument
		// to Array.map to modify the entries array
		if (modify) {
			entries = entries.map(entry => {
				let modified = modify(entry);
				if (modified) return modified;

				this.exception = true;
				return entry;
			});
		}

		if (modifyOutput) return entries.map(modifyOutput);
		return entries;
	}

	/**
	 * Method for getting one entry from a list of entries
	 * 
	 * Based on the `XmlTree.entries` method
	 */
	entry (): Element | null;

	/**
	 * Method for getting one entry from a list of entries
	 * @param index index of an item in a list of entries
	 * 
	 * Based on the `XmlTree.entries` method
	 */
	entry (index: number): Element | null;

	/**
	 * Method for getting one entry from a list of entries
	 * @param index index of an item in a list of entries
	 * @param modify function to change the currently selected item
	 * 
	 * Based on the `XmlTree.entries` method
	 */
	entry (index: number, modify?: XmlTreeFunctions.ModifyFunction): Element | null;

	/**
	 * Method for getting one entry from a list of entries
	 * @param index index of an item in a list of entries
	 * @param modify function to change the currently selected item
	 * @param modifyOutput function to change currently selected item
	 * 
	 * Based on the `XmlTree.entries` method
	 */
	entry<U> (
		index: number,
		modify: XmlTreeFunctions.ModifyFunction,
		modifyOutput: (entry: Element) => U
	): U;

	entry<U> (
		index = 0,
		modify?: XmlTreeFunctions.ModifyFunction,
		modifyOutput?: (entry: Element) => U
	): U {
		let entry: any = this.entries(modify || null)[index];

		// If an output modification function is provided, execute it and
		// use the result of the execution as a entry
		if (entry && modifyOutput) entry = modifyOutput(entry);
		return entry;
	}

	/**
	 * Method for getting parsed innerHTML of the first element in a list of entries
	 */
	html (): string;

	/**
	 * Method for getting parsed innerHTML of a specific element in a list of entries
	 * @param index index of an item in a list of entries
	 */
	html (index: number): string;

	/**
	 * Method for getting parsed innerHTML of a specific element in a list of entries
	 * @param index index of an item in a list of entries
	 * @param modifyHTML function for modification the resulting innerHTML
	 */
	html (index: number, modifyHTML: XmlTreeFunctions.ModifyTextFunction | null): string;

	/**
	 * Method for getting parsed innerHTML of a specific element in a list of entries
	 * @param index index of an item in a list of entries
	 * @param modifyHTML function for modification the resulting innerHTML
	 * @param modify function to change the currently selected item
	 */
	html (
		index: number,
		modifyHTML: XmlTreeFunctions.ModifyTextFunction | null,
		modify: XmlTreeFunctions.ModifyFunction
	): string;

	html (
		index = 0,
		modifyHTML?: XmlTreeFunctions.ModifyTextFunction | null,
		modify?: XmlTreeFunctions.ModifyFunction
	) {
		const entry = this.entry(index, modify);
		let html = entry ? entry.innerHTML : String();

		if (modifyHTML) html = modifyHTML(html);
		return html
			.replace(/\r|\n/g, "")
			.replace(/\n{3,}/g, "\n\n")
			.replace(/\s{2,}/g, " ")
			.trim();
	}

	/**
	 * Method to get the attribute of the selected entry
	 * @param name attribute name
	 */
	attribute (name: string): string | null;

	/**
	 * Method to get the attribute of the selected entry
	 * @param name attribute name
	 * @param index index of an item in a list of entries
	 */
	attribute (name: string, index: number): string | null;

	/**
	 * Method to get the attribute of the selected entry
	 * @param name attribute name
	 * @param index index of an item in a list of entries
	 * @param modifyOutput function for modification the resulting attribute value
	 */
	attribute (
		name: string,
		index: number,
		modifyOutput: XmlTreeFunctions.ModifyTextFunction | null
	): string | null;

	/**
	 * Method to get the attribute of the selected entry
	 * @param name attribute name
	 * @param index index of an item in a list of entries
	 * @param modifyOutput function for modification the resulting attribute value
	 * @param modify function to change the currently selected item
	 */
	attribute (
		name: string,
		index: number,
		modifyOutput: XmlTreeFunctions.ModifyTextFunction | null,
		modify: XmlTreeFunctions.ModifyFunction
	): string | null;

	attribute (
		name: string,
		index = 0,
		modifyOutput?: XmlTreeFunctions.ModifyTextFunction | null,
		modify?: XmlTreeFunctions.ModifyFunction
	) {
		const entry = this.entry(index, modify);
		if (!entry) return null;

		let attribute = entry.getAttribute(name);
		if (attribute && modifyOutput) attribute = modifyOutput(attribute);

		return attribute;
	}
}

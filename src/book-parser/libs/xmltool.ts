import { ElementQuerySelectException } from "./exceptions";

/**
 * Function for faster work with HTML elements and their attributes
 * @param input element or key of HTMLElementTagNameMap
 * @returns wrapped html element
 */
export default function $<T extends HTMLElement> (input: keyof HTMLElementTagNameMap | Element | null) {
	let element: T;

	// Check input and create element if input is key of HTMLElementTagNameMap
	if (typeof input == "string") element = document.createElement(input) as T;
	else element = input as T;

	// Available options for object control
	class Params {
		/**
         * Method for managing object attributes
         * @param attrib Object attribute name
         * @param value The value to set for the selected attribute
         */
		public attribute (attrib: string, value: string): this;

		/**
         * Method for managing object attributes
         * @param attrib Object attribute name
         * @param value The value to set for the selected attribute
         */
		public attribute (attrib: string): string;

		public attribute (attrib: string, value?: string): string | this {
			if (!value) return String(element.getAttribute(attrib));

			element.setAttribute(attrib, value);
			return this;
		}

		/**
         * A function that replaces the default querySelectorAll with a more user-friendly interface
         * @param selectors a query selectors to find an element
         * @returns list of wrapped HTML elements
		 * @throws ElementQuerySelectException if the search item is missing
         */
		public find (...selectors: string[]) {
			let total: this[] = [];
			selectors.forEach(selector => {
				const list = Array.from(element.querySelectorAll(selector)).map(e => $(e));
				total = [ ...total, ...(list as this[]) ];
			});

			if (total.length < 1) throw new ElementQuerySelectException();
			return total;
		}

		/**
		 * An alternative implementation of the find function that does not throw an error if the search item is missing
		 * @param selectors a query selectors to find an element
		 * @returns list of wrapped HTML elements or list of one empty HTML element
		 */
		public search (...selectors: string[]): this[] {
			try {
				return this.find(...selectors);
			} catch (exception) {
				return [ $("div") as this ];
			}
		}

		/**
         * HTML object reference
         */
		public readonly obj = element;
	}

	return new Params();
}

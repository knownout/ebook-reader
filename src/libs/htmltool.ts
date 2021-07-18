// Function for faster work with HTML elements and their attributes
export function $<T extends HTMLElement> (input: keyof HTMLElementTagNameMap | Element) {
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
         * HTML object reference
         */
		public readonly obj = element;
	}

	return new Params();
}

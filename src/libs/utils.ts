const defaultExcludeTags = [ "b", "bold", "strong", "s", "u", "i" ];

/**
 * A procedure that invokes a callback if the browser supports extended regex options
 * @param callback function to be called if the browser supports extended regex
 */
const whenRegexSupported = (callback: () => any): void =>
	'<tag ns="nf">'.replace(/(?<=<\w+)\s+[^>]+/gi, "") === "<tag>" ? callback() : null;

/**
 * Function to remove HTML tags and extra spaces from text
 * @param rawText input text
 * @returns clean text
 */
export function getCleanText (rawText: string, excludeTags: string[] = defaultExcludeTags): string {
	let text = rawText.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");

	// BUG positive lookbehind may not be supported
	// FIXME optimization for this part

	// BUG Tags will only be excluded if extended regex options are supported by the client browser
	whenRegexSupported(() => {
		// Removing all html tag parameters
		text = text.replace(/(?<=<\w+)\s+[^>]+/gi, "");

		// Replacing brackets with square brackets for excluded tags
		excludeTags.forEach(tag => {
			text = text
				.replace(new RegExp(`<${tag}>`, "g"), `[${tag}]`)
				.replace(new RegExp(`</${tag}>`, "g"), `[/${tag}]`);
		});
	});

	// Removing all tags from text
	text = text.replace(/(<([^>]+)>)/gi, "").replace(/\s{2,}/gi, " ");
	return text.trim();
}

export type TNCXChapterData = {
	playOrder: number;
	text: string;
	fileLocation: string;
};

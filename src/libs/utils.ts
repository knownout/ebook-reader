/**
 * Function to remove HTML tags and extra spaces from text
 * @param rawText input text
 * @returns clean text
 */
export function getCleanText (rawText: string): string {
	// FIXME regex optimization
	let text = rawText.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
	text = text.replace(/(<([^>]+)>)/gi, "").replace(/\s{2,}/gi, " ");

	return text.trim();
}

export type TNCXChapterData = {
	playOrder: number;
	text: string;
	fileLocation: string;
};

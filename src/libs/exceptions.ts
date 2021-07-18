export class Exception {
	public message: string;
	public constructor (...message: string[]) {
		this.message = message.join(" ");
	}
}

export class CompressedXMLFileOpenException extends Exception {
	public constructor (...message: string[]) {
		super(message.join(" "));
		this.message = [ "Exception when opening a compressed XML file", this.message ].join(" ").trim();
	}
}

export class ElementQuerySelectException extends Exception {
	public constructor (...message: string[]) {
		super(message.join(" "));
		this.message = [ "Exception when trying to find element in dom tree", this.message ].join(" ").trim();
	}
}

export class FileOpenException extends Exception {
	public constructor (...message: string[]) {
		super(message.join(" "));
		this.message = [ "Exception when trying to open file", this.message ].join(" ").trim();
	}
}

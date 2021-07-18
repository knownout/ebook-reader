import React from "react";
import $ from "../book-parser/libs/xmltool";
import BookParser from "../book-parser/parser";

interface IBookOpenPageProps {}
interface IBookOpenPageState {}

export class BookOpenPage extends React.Component<IBookOpenPageProps, IBookOpenPageState> {
	public readonly state: IBookOpenPageState = {};
	constructor (props: IBookOpenPageProps) {
		super(props);

		this.onButtonClick = this.onButtonClick.bind(this);
	}

	public render () {
		return (
			<div>
				<div>Book open page</div>
				<button onClick={this.onButtonClick}>Open E-book</button>
			</div>
		);
	}

	private onButtonClick (): void {
		const input = $<HTMLInputElement>("input")
			.attribute("type", "file")
			.attribute("accept", ".epub, .mobi")
			.attribute("multiple", "false").obj;

		input.click();
		input.addEventListener("change", () => {
			const parser = new BookParser(input.files);
			parser.openBook();

			input.remove();
		});
	}
}

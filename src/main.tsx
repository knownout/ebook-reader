import "normalize.css";
import "./root.less";

import ReactDOM from "react-dom";
import React from "react";
import { $ } from "./libs/htmltool";
import BookParser from "./book-parser/core";

interface AppState {}
interface AppProps {}
class App extends React.Component<AppProps, AppState> {
	public readonly state: AppState = {};
	constructor (props: AppProps) {
		super(props);
		this.onButtonClick = this.onButtonClick.bind(this);
	}

	public render () {
		return <button onClick={this.onButtonClick}>Open E-book</button>;
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

ReactDOM.render(<App />, document.querySelector("main#app-root"));

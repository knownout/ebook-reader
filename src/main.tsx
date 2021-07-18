import "normalize.css";
import "./root.less";

import ReactDOM from "react-dom";
import React from "react";
import $ from "./book-parser/libs/xmltool";
import BookParser from "./book-parser/parser";
import { BookOpenPage } from "./user-interface/book-open";

interface AppState {}
interface AppProps {}
class App extends React.Component<AppProps, AppState> {
	public readonly state: AppState = {};
	constructor (props: AppProps) {
		super(props);
	}

	public render () {
		return <BookOpenPage />;
	}
}

ReactDOM.render(<App />, document.querySelector("main#app-root"));

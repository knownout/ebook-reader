import "normalize.css";
import "./root.less";

import ReactDOM from "react-dom";
import React from "react";
import { Reader } from "./user-interface/reader";

interface AppState {}
interface AppProps {}
class App extends React.Component<AppProps, AppState> {
	public readonly state: AppState = {};
	constructor (props: AppProps) {
		super(props);
	}

	public render () {
		return <Reader />;
	}
}

ReactDOM.render(<App />, document.querySelector("main#app-root"));

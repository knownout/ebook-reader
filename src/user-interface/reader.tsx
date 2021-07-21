import React, { useState } from "react";
import $ from "../book-parser/libs/xmltool";
import BookParser from "../book-parser/parser";
import { Button, Page, TPageState } from "./components";

import "./styles/reader.less";

function TitlePage (props: {
	state: TPageState;
	setState: (state: TPageState) => void;
	pageRef?: React.RefObject<HTMLDivElement>;
}) {
	const onButtonClick = () => {
		const input = $<HTMLInputElement>("input")
			.attribute("type", "file")
			.attribute("accept", ".epub, .mobi")
			.attribute("multiple", "false").obj;

		input.click();
		input.onchange = async () => {
			const parser = new BookParser(input.files);
			try {
				const book = await parser.openBook();
				console.log(book);
			} catch (e) {
				setErrorEffect(true);
				setTimeout(() => setErrorEffect(false), 700);
			}

			input.remove();
		};
	};

	const [ errorEffect, setErrorEffect ] = useState(false);

	return (
		<Page {...props}>
			<div className="app-title">KWT E-book Reader</div>
			<article className="application-lore" data-title="Application Lore">
				<p>
					<b>"KWT E-book Reader"</b> is a free e-book reader application of the most common book formats (fb2,
					epub, mobi).
				</p>
				<p>
					The application runs locally on the device and uses the server only to load its own files into the
					browser cache.
				</p>
				<p>
					All data about open books <i>(bookmarks, metadata, etc)</i> is stored only in the local storage of
					your browser <i>(LocalStorage or SessionStorage)</i>.
				</p>
			</article>
			<Button className="open-book" onClick={onButtonClick} errorEffect={errorEffect} />
		</Page>
	);
}

interface IBookOpenPageProps {}
interface IBookOpenPageState {
	pageName: string;
	pageState: TPageState;
	flex: boolean;
}

export class Reader extends React.Component<IBookOpenPageProps, IBookOpenPageState> {
	private readonly flexPageRef = React.createRef<HTMLDivElement>();
	public readonly state: IBookOpenPageState = {
		pageName: "title",
		pageState: "opening",
		flex: true
	};

	constructor (props: IBookOpenPageProps) {
		super(props);
		this.updateFlexStatus = this.updateFlexStatus.bind(this);
	}

	componentDidMount () {
		this.updateFlexStatus();
		window.addEventListener("resize", this.updateFlexStatus);
	}

	private updateFlexStatus () {
		const flexPage = this.flexPageRef.current;

		if (flexPage) {
			const height = flexPage.offsetHeight;
			if (window.innerHeight <= height) this.setState({ flex: false });
			else this.setState({ flex: true });
		}
	}

	public render () {
		const attributes = {
			setState: (pageState: TPageState) => this.setState({ pageState }),
			state: this.state.pageState
		};

		return (
			<div className="page-wrapper" data-flex={this.state.flex}>
				<TitlePage {...attributes} pageRef={this.flexPageRef} />
			</div>
		);
	}
}

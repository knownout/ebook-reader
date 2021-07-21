import React from "react";

import { TBook } from "../book-parser/parser";
import { TPageState } from "./components";

import { ReaderPage } from "./pages/reader-page";
import { TitlePage } from "./pages/title-page";

import "./styles/reader.less";

interface IBookOpenPageProps {}
interface IBookOpenPageState {
	pageName: string;
	pageState: TPageState;
	flex: boolean;
	book?: TBook | null;
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
			default: {
				setState: (pageState: TPageState) => this.setState({ pageState }),
				state: this.state.pageState
			},
			extra: {
				updateBook: (book: TBook) => {
					this.setState({ book, pageState: "closing" }, () => {
						setTimeout(() => this.setState({ pageName: "reader", pageState: "opening" }), 200);
					});
				}
			}
		};

		return (
			<div className="page-wrapper" data-flex={this.state.flex}>
				{this.state.book && this.state.pageName == "reader" ? (
					<ReaderPage
						{...attributes.default}
						updateBookState={book => this.setState({ book })}
						book={this.state.book}
						setPageState={(pageName, pageState) => this.setState({ pageName, pageState })}
					/>
				) : (
					<TitlePage {...attributes.default} {...attributes.extra} pageRef={this.flexPageRef} />
				)}
			</div>
		);
	}
}

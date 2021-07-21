import React from "react";
import { Button, IDefaultPageProps, Page, TPageState } from "../components";
import { TBook } from "../../book-parser/parser";

interface IReaderPageProps {
	book: TBook;
	updateBookState: (book: TBook | null) => void;
	setPageState: (title: string, state: TPageState) => void;
}

export function ReaderPage (props: IDefaultPageProps & IReaderPageProps) {
	return (
		<Page {...props}>
			<div className="stub">
				Reader page for book: <b>{props.book.metadata.title}</b>
				<Button
					icon="bi bi-box-arrow-left"
					onClick={() => {
						props.setPageState("reader", "closing");

						setTimeout(() => {
							props.updateBookState(null);
							props.setPageState("title", "opening");
						}, 200);
					}}
				>
					Back
				</Button>
			</div>
		</Page>
	);
}

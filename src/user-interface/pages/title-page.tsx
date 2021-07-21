import React, { useState } from "react";
import $ from "../../book-parser/libs/xmltool";
import { Button, IDefaultPageProps, Page } from "../components";
import BookParser, { TBook } from "../../book-parser/parser";

interface ITitlePageProps {
	pageRef?: React.RefObject<HTMLDivElement>;
	updateBook: (book: TBook) => void;
}

export function TitlePage (props: IDefaultPageProps & ITitlePageProps) {
	const [ errorEffect, setErrorEffect ] = useState(false);

	const onButtonClick = () => {
		const input = $<HTMLInputElement>("input")
			.attribute("type", "file")
			.attribute("accept", ".epub, .mobi")
			.attribute("multiple", "false").obj;

		input.click();
		input.onchange = async () => {
			const parser = new BookParser(input.files);
			try {
				props.updateBook(await parser.openBook());
			} catch (e) {
				setErrorEffect(true);
				setTimeout(() => setErrorEffect(false), 700);
			}

			input.remove();
		};
	};

	return (
		<Page {...props}>
			<div className="title">KWT E-book Reader</div>
			<article className="application-lore text-content" data-title="Application Lore">
				<p>
					<b>"KWT E-book Reader"</b> is a free e-book reader application of the most common book formats (epub
					and mobi).
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
			<Button className="open-book" onClick={onButtonClick} exception={errorEffect} icon="bi bi-journals">
				Select E-book
			</Button>
		</Page>
	);
}

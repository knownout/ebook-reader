import React, { useEffect } from "react";
import "./styles/components.less";

export function Button (props: {
	className?: string;
	onClick?: (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => any;
	errorEffect?: boolean;
}) {
	const className = [ "button-wrapper", props.className || " " ].join(" ").replace(/\s{2,}/g, " ").trim();
	const { errorEffect, ...localProps } = { ...props };

	return (
		<div {...localProps} className={className} data-error={props.errorEffect}>
			<div className="button-background" />
			<div className="button">
				<i className="bi bi-journals" />
				<span className="text">Select E-book</span>
			</div>
		</div>
	);
}

export type TPageState = "opened" | "opening" | "closing" | "closed";
export function Page (props: {
	children: any;
	state: TPageState;
	setState: (state: TPageState) => void;
	pageRef?: any;
}) {
	useEffect(() => {
		if (props.state == "opening") setTimeout(() => props.setState("opened"), 450);
	});

	return (
		<div className="page content-wrapper" page-state={props.state} ref={props.pageRef}>
			{props.children}
		</div>
	);
}

import React, { useEffect } from "react";
import "./styles/components.less";

export type TPageState = "opened" | "opening" | "closing" | "closed";
export interface IDefaultPageProps {
	setState: (state: TPageState) => void;
	state: TPageState;

	children?: any;

	pageRef?: any;
}

export function Button (props: {
	children: string;

	onClick?: (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => any;

	className?: string;
	exception?: boolean;

	icon?: string;
}) {
	const className = [ "button-wrapper", props.className || " " ].join(" ").replace(/\s{2,}/g, " ").trim();
	const { exception: errorEffect, ...localProps } = { ...props };

	return (
		<div {...localProps} className={className} data-error={props.exception}>
			<div className="button-background" />
			<div className="button">
				{props.icon ? <i className={props.icon} /> : null}
				<span className="text">{props.children}</span>
			</div>
		</div>
	);
}

export function Page (props: IDefaultPageProps) {
	useEffect(() => {
		if (props.state == "opening") setTimeout(() => props.setState("opened"), 200);
	});

	return (
		<div className="page content-wrapper" page-state={props.state} ref={props.pageRef}>
			{props.children}
		</div>
	);
}

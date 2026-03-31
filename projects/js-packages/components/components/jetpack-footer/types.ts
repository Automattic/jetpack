export type JetpackFooterMenuItem = {
	href: string;
	label: string;
	onClick?: () => void;
	onKeyDown?: () => void;
	target?: string;
	title?: string;
	role?: string;
};

export type JetpackFooterProps = {
	/**
	 * Additional className of the wrapper, `jetpack-footer` always included.
	 */
	className?: string;

	/**
	 * Navigation menu to display in the footer.
	 */
	menu?: JetpackFooterMenuItem[];
};

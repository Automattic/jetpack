export type JetpackFooterMenuItem = {
	href?: string;
	label: string;
	onClick?: () => void;
	onKeyDown?: () => void;
	title?: string;
};

export type JetpackFooterProps = {
	/**
	 * Additional className of the wrapper, `jetpack-footer` always included.
	 */
	className?: string;

	/**
	 * Additional links to display in the footer.
	 */
	menu?: JetpackFooterMenuItem[];
};

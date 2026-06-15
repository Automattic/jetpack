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

	/**
	 * Whether to include the default "Products" and "Help" links (shown on
	 * non-WordPress.com, non-network-admin contexts). Set to `false` for screens
	 * where those links aren't relevant. Defaults to `true`.
	 */
	showDefaultLinks?: boolean;
};

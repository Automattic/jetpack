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
	 * additional className of the wrapper, `jp-dashboard-footer` always included.
	 */
	className?: string;

	/**
	 * Navigation menu to display in the footer.
	 */
	menu?: JetpackFooterMenuItem[];

	/**
	 * URL of the site WP Admin.
	 */
	siteAdminUrl?: string;
};

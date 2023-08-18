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
	 * Name of the module, e.g. 'Jetpack Search'.
	 */
	moduleName?: string;

	/**
	 * additional className of the wrapper, `jp-dashboard-footer` always included.
	 */
	className?: string;

	/**
	 * Link that the Module name will link to (optional).
	 */
	moduleNameHref?: string;

	/**
	 * Navigation menu to display in the footer.
	 */
	menu?: JetpackFooterMenuItem[];

	/**
	 * URL of the site WP Admin.
	 */
	siteAdminUrl?: string;

	/**
	 * Function called when the About link is clicked.
	 */
	onAboutClick?: () => void;

	/**
	 * Function called when the Privacy link is clicked.
	 */
	onPrivacyClick?: () => void;

	/**
	 * Function called when the Terms link is clicked.
	 */
	onTermsClick?: () => void;
};

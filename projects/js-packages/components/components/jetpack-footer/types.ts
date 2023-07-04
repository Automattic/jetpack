type JetpackFooterMenuItem = {
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
	 * Link for 'An Automattic Airline'.
	 */
	a8cLogoHref?: string;

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
};

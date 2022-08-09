export type AdminPageProps = {
	/**
	 * The page content
	 */
	children: React.ReactNode;

	/**
	 * Link for 'An Automattic Airline' in the footer.
	 */
	a8cLogoHref?: string;

	/**
	 * Name of the module, e.g. 'Jetpack Search' that will be displayed in the footer.
	 */
	moduleName?: string;

	/**
	 * Whether or not to display the Header
	 */
	showHeader?: boolean;

	/**
	 * Custom header. Optional
	 */
	header?: React.ReactNode;

	/**
	 * Whether or not to display the Footer
	 */
	showFooter?: boolean;

	/**
	 * Link that the Footer Module name will link to (optional).
	 */
	moduleNameHref?: string;

	/**
	 * Whether or not to display the Background Color
	 */
	showBackground?: boolean;
};

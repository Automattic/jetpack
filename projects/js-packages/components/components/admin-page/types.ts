import type { JetpackFooterMenuItem } from '../jetpack-footer/types.ts';

export type AdminPageProps = {
	/**
	 * The page content
	 */
	children: React.ReactNode;

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
	 * Whether or not to link to Jetpack plugin admin pages.
	 */
	useInternalLinks?: boolean;

	/**
	 * Link that the Footer Module name will link to (optional).
	 */
	moduleNameHref?: string;

	/**
	 * Whether or not to display the Background Color
	 */
	showBackground?: boolean;

	/**
	 * URL of the site WP Admin.
	 */
	siteAdminUrl?: string;

	/**
	 * The domain of the sanboxed API.
	 */
	sandboxedDomain?: string;

	/**
	 * The root URL of the API.
	 */
	apiRoot?: string;

	/**
	 * The nonce of the API.
	 */
	apiNonce?: string;

	/**
	 * Optional menu items to be displayed
	 */
	optionalMenuItems?: JetpackFooterMenuItem[];
};

import type { JetpackFooterMenuItem } from '../jetpack-footer/types.ts';
import type { ReactNode } from 'react';

export type AdminPageProps = {
	/**
	 * The page content
	 */
	children: ReactNode;

	/**
	 * Name of the module, e.g. 'Jetpack Search' that will be displayed in the footer.
	 */
	moduleName?: string;

	/**
	 * Whether or not to display the Header
	 */
	showHeader?: boolean;

	/**
	 * Custom header. Optional.
	 * @deprecated Use `title` and `subTitle` props instead for the unified header.
	 */
	header?: ReactNode;

	/**
	 * Product title displayed in the unified header (e.g. "Social", "Backup").
	 * When provided, renders the admin-ui Page header instead of the legacy header slot.
	 */
	title?: string;

	/**
	 * Optional tagline displayed below the title in the unified header.
	 */
	subTitle?: ReactNode;

	/**
	 * Custom logo element for the unified header. Defaults to JetpackLogo icon.
	 */
	logo?: ReactNode;

	/**
	 * Action elements displayed on the right side of the unified header.
	 */
	actions?: ReactNode;

	/**
	 * Tab navigation displayed below the title/tagline in the unified header.
	 */
	tabs?: ReactNode;

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

	/**
	 * Class name to be applied to the root element of the component.
	 */
	className?: string;

	/**
	 * Show bottom border of the header. Defaults to true.
	 * Hidden when `tabs` is used.
	 */
	showBottomBorder?: boolean;
};

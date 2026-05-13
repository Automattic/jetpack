import type { JetpackFooterMenuItem } from '../jetpack-footer/types.ts';
import type { ReactNode } from 'react';

export type AdminPageProps = {
	/**
	 * The page content
	 */
	children: ReactNode;

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
	 * Breadcrumb navigation displayed next to the title in the unified header.
	 */
	breadcrumbs?: ReactNode;

	/**
	 * Tab navigation displayed below the title/tagline in the unified header.
	 */
	tabs?: ReactNode;

	/**
	 * Whether or not to display the Footer
	 */
	showFooter?: boolean;

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

	/**
	 * Render `children` directly inside the admin-ui Page, skipping the
	 * default `<Container fluid horizontalSpacing={0}><Col>{children}</Col></Container>`
	 * wrap. Use for full-bleed pages (DataViews-based admin surfaces, full-app
	 * dashboards) that own their own scroll/layout model and don't want the
	 * outer Container's grid to break their flex chain. Defaults to `false`.
	 */
	unwrapped?: boolean;
};

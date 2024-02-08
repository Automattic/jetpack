import type { AdminPageProps as JetpackAdminPageProps } from '@automattic/jetpack-components/components/admin-page/types';

export type AdminPageProps = JetpackAdminPageProps & {
	/**
	 * Page Headline.
	 *
	 * This headline will be shown at the top of the page, below the navigation menu.
	 */
	headline?: string;
	/**
	 * Sub headline
	 *
	 * This sub headline will be shown below the page headline.
	 */
	subHeadline?: string;
};

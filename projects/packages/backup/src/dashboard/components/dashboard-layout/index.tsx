import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import DevModeBanner from '../dev-mode-banner';
import './style.scss';
import type { ReactNode } from 'react';

type Props = {
	children: ReactNode;
	actions?: ReactNode;
};

const PRODUCT_NAME = 'VaultPress Backup'; // Product name; do not translate.

/**
 * Shared shell for every screen of the modernized Backup dashboard.
 *
 * Wraps a `<Page>` from `@wordpress/admin-ui` (the standard wp-admin
 * chrome) with a Jetpack logo in the `visual` slot, the dev-mode banner,
 * the page body, and `<JetpackFooter>` at the bottom — matching every
 * other modernized Jetpack dashboard (Newsletter, VideoPress, Forms).
 *
 * The page is laid out so the body grows to fill the viewport and the
 * footer stays parked at the bottom when content is short, but scrolls
 * naturally with the body when it overflows.
 *
 * @param props          - Component props.
 * @param props.children - Screen contents to render inside the page body.
 * @param props.actions  - Optional nodes rendered in the page header's top-right action slot.
 * @return The rendered dashboard shell.
 */
export default function DashboardLayout( { children, actions }: Props ) {
	return (
		<Page
			className="jpb-dashboard-layout jp-admin-page"
			visual={ <JetpackLogo showText={ false } height={ 20 } /> }
			title={ PRODUCT_NAME }
			ariaLabel={ PRODUCT_NAME }
			subTitle={ __(
				'Save changes and restore quickly with one-click recovery.',
				'jetpack-backup-pkg'
			) }
			hasPadding={ false }
			actions={ actions }
		>
			<DevModeBanner />
			<div className="jpb-dashboard-body">
				<div className="jpb-dashboard-body__inner">{ children }</div>
			</div>
			<JetpackFooter />
		</Page>
	);
}

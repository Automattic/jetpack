import AdminPage from '@automattic/jetpack-components/admin-page';
import { getHeaderControlsSlot } from '@automattic/jetpack-my-jetpack/header-controls';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { isMyJetpackAvailable } from '../overview/lib/use-modules-state';
import BoostBreadcrumbs from './boost-breadcrumbs';
import './boost-page.scss';
import type { ReactNode } from 'react';

type Props = {
	isSubpage: boolean;
	children: ReactNode;
	subpage: ReactNode;
	actions?: ReactNode;
};

export default function BoostPage( { isSubpage, children, subpage, actions }: Props ) {
	const showBreadcrumbs = isMyJetpackAvailable();

	return (
		<AdminPage
			className={ clsx( 'jetpack-boost-page', { 'jetpack-boost-page--subpage': isSubpage } ) }
			title={
				! isSubpage && ! showBreadcrumbs
					? 'Boost' /** Product name, do not translate. */
					: undefined
			}
			// Not undefined on subpages: AdminPage would switch layout and remount the portal slots.
			breadcrumbs={ isSubpage ? <></> : showBreadcrumbs ? <BoostBreadcrumbs /> : undefined }
			subTitle={ __( 'Improve your site speed and performance.', 'jetpack-boost' ) }
			actions={ actions }
			globalControls={ getHeaderControlsSlot( 'boost' ) }
			apiRoot={ wpApiSettings.root }
			apiNonce={ wpApiSettings.nonce }
			showFooter={ ! isSubpage }
		>
			<div hidden={ isSubpage }>
				<div className="jetpack-boost-page__content">
					{ /* The JITM script moves its card here, since the page template hides the default spot. */ }
					<div id="jp-admin-notices" className="jetpack-boost-page__notices" />
					{ children }
				</div>
			</div>
			{ subpage }
		</AdminPage>
	);
}

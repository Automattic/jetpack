import AdminPage from '@automattic/jetpack-components/admin-page';
import IDCModal from '@automattic/jetpack-idc/idc-modal';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import './boost-page.scss';
import type { ReactNode } from 'react';

type Props = {
	isSubpage: boolean;
	children: ReactNode;
	subpage: ReactNode;
	actions?: ReactNode;
};

export default function BoostPage( { isSubpage, children, subpage, actions }: Props ) {
	return (
		<AdminPage
			className={ clsx( 'jetpack-boost-page', { 'jetpack-boost-page--subpage': isSubpage } ) }
			title="Boost"
			subTitle={ __( 'Improve your site speed and performance.', 'jetpack-boost' ) }
			actions={ actions }
			apiRoot={ wpApiSettings.root }
			apiNonce={ wpApiSettings.nonce }
			showFooter={ ! isSubpage }
		>
			<IDCModal />
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

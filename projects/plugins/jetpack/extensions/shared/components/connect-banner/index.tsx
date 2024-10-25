/*
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
/*
 * Internal dependencies
 */
import useAutosaveAndRedirect from '../../use-autosave-and-redirect';
import { Nudge } from '../upgrade-nudge';
import type { MouseEvent, FC } from 'react';

interface ConnectBannerProps {
	block: string;
	explanation?: string;
}

import './style.scss';

const ConnectBanner: FC< ConnectBannerProps > = ( { block, explanation = null } ) => {
	const checkoutUrl = `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?page=my-jetpack#/connection`;
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );
	const { tracks } = useAnalytics();

	const goToCheckoutPage = ( event: MouseEvent< HTMLButtonElement > ) => {
		tracks.recordEvent( 'jetpack_editor_connect_banner_click', { block } );
		autosaveAndRedirect( event );
	};

	return (
		<div>
			<Nudge
				buttonText={ __( 'Connect Jetpack', 'jetpack' ) }
				checkoutUrl={ checkoutUrl }
				className="jetpack-connect-banner-nudge"
				description={ __( 'Your account is not connected to Jetpack at the moment.', 'jetpack' ) }
				goToCheckoutPage={ goToCheckoutPage }
				isRedirecting={ isRedirecting }
			/>
			<div className="jetpack-connect-banner">
				{ explanation && (
					<div className="jetpack-connect-banner__explanation">
						<p>{ explanation }</p>
					</div>
				) }
			</div>
		</div>
	);
};

export default ConnectBanner;

/*
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
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

const getRedirectUri = () => {
	const pathname = window?.location?.pathname.replace( 'wp-admin/', '' );
	const search = window?.location?.search;

	return `${ pathname }${ search }`;
};

const ConnectBanner: FC< ConnectBannerProps > = ( { block, explanation = null } ) => {
	const { handleConnectUser } = useConnection( {
		from: 'editor',
		redirectUri: getRedirectUri(),
		autoTrigger: false,
		skipPricingPage: true,
	} );
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect();
	const { tracks } = useAnalytics();

	const goToCheckoutPage = ( event: MouseEvent< HTMLButtonElement > ) => {
		handleConnectUser();
		tracks.recordEvent( 'jetpack_editor_connect_banner_click', { block } );
		autosaveAndRedirect( event );
	};

	return (
		<div>
			<Nudge
				buttonText={ __( 'Connect Jetpack', 'jetpack' ) }
				className="jetpack-connect-banner-nudge"
				description={ __( 'Your account is not connected to Jetpack at the moment.', 'jetpack' ) }
				goToCheckoutPage={ goToCheckoutPage }
				checkoutUrl={ '#' }
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

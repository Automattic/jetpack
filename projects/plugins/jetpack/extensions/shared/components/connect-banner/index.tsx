/*
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import { useAnalytics, useAutosaveAndRedirect } from '@automattic/jetpack-shared-extension-utils';
import { Nudge } from '@automattic/jetpack-shared-extension-utils/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from 'react';
/*
 * Internal dependencies
 */
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
	const [ isReadyToRedirect, setIsReadyToRedirect ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const { handleConnectUser } = useConnection( {
		from: 'editor',
		redirectUri: getRedirectUri(),
		autoTrigger: false,
		skipPricingPage: true,
	} );
	const { autosave } = useAutosaveAndRedirect();
	const { tracks } = useAnalytics();

	const goToConnectPage = ( event: MouseEvent< HTMLButtonElement > ) => {
		setIsSaving( true );
		autosave( event ).then( () => {
			tracks.recordEvent( 'jetpack_editor_connect_banner_click', { block } );
			setIsReadyToRedirect( true );
			setIsSaving( false );
		} );
	};

	useEffect( () => {
		// The redirection is handled this way to ensure we get the right redirectUri
		// In the case that the post is new and unsaved, the component requires a re-render
		// in order to get the correct URI when the handler is called.
		if ( isReadyToRedirect ) {
			handleConnectUser();
		}
	}, [ isReadyToRedirect, handleConnectUser ] );

	return (
		<div>
			<Nudge
				buttonText={ __( 'Connect Jetpack', 'jetpack' ) }
				className="jetpack-connect-banner-nudge"
				description={ __( 'Your account is not connected to Jetpack at the moment.', 'jetpack' ) }
				goToCheckoutPage={ goToConnectPage }
				checkoutUrl={ '#' }
				isRedirecting={ isReadyToRedirect || isSaving }
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

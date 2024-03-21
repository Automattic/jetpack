import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import type { Props as ConnectScreenVisualProps } from './visual';
import './style.scss';

export type Props = Pick< ConnectScreenVisualProps, 'errorCode' | 'isOfflineMode' >;

/*
 * The Connection Screen error message.
 */
const ConnectScreenErrorMessage: React.FC< Props > = ( { errorCode, isOfflineMode } ) => {
	// Explicit error code takes precedence over the offline mode.
	switch ( errorCode ) {
		case 'fail_domain_forbidden':
		case 'fail_ip_forbidden':
		case 'fail_domain_tld':
		case 'fail_subdomain_wpcom':
		case 'siteurl_private_ip':
			return (
				<>
					{ __(
						'Your site host is on a private network. Jetpack can only connect to public sites.',
						'jetpack'
					) }
				</>
			);
	}

	if ( isOfflineMode ) {
		return createInterpolateElement( __( 'Unavailable in <a>Offline Mode</a>', 'jetpack' ), {
			a: (
				<a
					href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
					target="_blank"
					rel="noopener noreferrer"
				/>
			),
		} );
	}

	return null;
};

export default ConnectScreenErrorMessage;

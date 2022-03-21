/**
 * External dependencies
 */
import React from 'react';
import { useSelect } from '@wordpress/data';
import { ConnectScreenRequiredPlan, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';

import '@automattic/jetpack-base-styles/style.scss';
import './use-connection.scss';

/**
 * Expose the `connectionStatus` state object and `renderConnectScreen()` to show a component used for connection.
 *
 * @returns {Array} connectionStatus, renderConnectScreen
 */
export default function useConnection() {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRootUrl(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);

	const renderConnectScreen = () => {
		return (
			<ConnectScreenRequiredPlan
				buttonLabel={ __( 'Get Jetpack Search', 'jetpack-search-pkg' ) }
				priceAfter={ 2.5 }
				priceBefore={ 5 }
				pricingIcon="data:image/svg+xml,%3Csvg width='32' height='32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M21 19l-5.154-5.154C16.574 12.742 17 11.42 17 10c0-3.866-3.134-7-7-7s-7 3.134-7 7 3.134 7 7 7c1.42 0 2.742-.426 3.846-1.154L19 21l2-2zM5 10c0-2.757 2.243-5 5-5s5 2.243 5 5-2.243 5-5 5-5-2.243-5-5z' fill='%23000'/%3E%3C/svg%3E"
				pricingTitle={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
				title={ __( 'The best WordPress search experience', 'jetpack-search-pkg' ) }
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				registrationNonce={ registrationNonce }
				from="jetpack-search"
				redirectUri="admin.php?page=jetpack-search"
			>
				<h3>
					{ __(
						"Allow viewers to search through your site's records, lightning fast.",
						'jetpack-search-pkg'
					) }
				</h3>
				<ul>
					<li>{ __( 'Customizable filtering', 'jetpack-search-pkg' ) }</li>
					<li>{ __( 'Support for 29 languages', 'jetpack-search-pkg' ) }</li>
					<li>
						{ __(
							'Content displayed within results is updated in real-time',
							'jetpack-search-pkg'
						) }
					</li>
					<li>
						{ __(
							"If you grow into a new pricing tier, we'll let you know before your next billing cycle",
							'jetpack-search-pkg'
						) }
					</li>
				</ul>
			</ConnectScreenRequiredPlan>
		);
	};

	return [ connectionStatus, renderConnectScreen ];
}

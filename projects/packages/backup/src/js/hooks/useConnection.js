import { ConnectScreenRequiredPlan, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { STORE_ID } from '../store';

/**
 * Expose the `connectionStatus` state object and `renderConnectScreen()` to show a component used for connection.
 *
 * @returns {Array} connectionStatus, renderConnectScreen
 */
export default function useConnection() {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const [ price, setPrice ] = useState( 0 );
	const [ priceAfter, setPriceAfter ] = useState( 0 );

	useEffect( () => {
		apiFetch( { path: '/jetpack/v4/backup-promoted-product-info' } ).then( res => {
			setPrice( res.cost / 12 );
			if ( res.introductory_offer ) {
				setPriceAfter( res.introductory_offer.cost_per_interval / 12 );
			} else {
				setPriceAfter( res.cost / 12 );
			}
		} );
	}, [] );

	const renderConnectScreen = () => {
		return (
			<ConnectScreenRequiredPlan
				buttonLabel={ __( 'Get Jetpack Backup', 'jetpack-backup-pkg' ) }
				priceAfter={ priceAfter }
				priceBefore={ price }
				pricingIcon="data:image/svg+xml,%3Csvg width='32' height='32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m21.092 15.164.019-1.703v-.039c0-1.975-1.803-3.866-4.4-3.866-2.17 0-3.828 1.351-4.274 2.943l-.426 1.524-1.581-.065a2.92 2.92 0 0 0-.12-.002c-1.586 0-2.977 1.344-2.977 3.133 0 1.787 1.388 3.13 2.973 3.133H22.399c1.194 0 2.267-1.016 2.267-2.4 0-1.235-.865-2.19-1.897-2.368l-1.677-.29Zm-10.58-3.204a4.944 4.944 0 0 0-.201-.004c-2.75 0-4.978 2.298-4.978 5.133s2.229 5.133 4.978 5.133h12.088c2.357 0 4.267-1.97 4.267-4.4 0-2.18-1.538-3.99-3.556-4.339v-.06c0-3.24-2.865-5.867-6.4-5.867-2.983 0-5.49 1.871-6.199 4.404Z' fill='%23000'/%3E%3C/svg%3E"
				pricingTitle={ __( 'Jetpack Backup', 'jetpack-backup-pkg' ) }
				title={ __(
					'Save every change and get back online quickly with one‑click restores.',
					'jetpack-backup-pkg'
				) }
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				registrationNonce={ registrationNonce }
				from="jetpack-backup"
				redirectUri="admin.php?page=jetpack-backup"
			>
				<ul>
					<li>{ __( 'Automated real-time backups', 'jetpack-backup-pkg' ) }</li>
					<li>{ __( 'Easy one-click restores', 'jetpack-backup-pkg' ) }</li>
					<li>{ __( 'Complete list of all site changes', 'jetpack-backup-pkg' ) }</li>
					<li>{ __( 'Global server infrastructure', 'jetpack-backup-pkg' ) }</li>
					<li>{ __( 'Best-in-class support', 'jetpack-backup-pkg' ) }</li>
				</ul>
			</ConnectScreenRequiredPlan>
		);
	};

	return [ connectionStatus, renderConnectScreen ];
}

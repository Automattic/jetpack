import restApi from '@automattic/jetpack-api';
import {
	ConnectionStatusCard,
	ConnectScreenRequiredPlan,
	CONNECTION_STORE_ID,
} from '@automattic/jetpack-connection';
import { useSelect, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import { STORE_ID } from '../../store';
import Header from '../header';
import './style.scss';

/**
 * The Connection IU Admin App.
 *
 * @param {object} props - The properties.
 * @param {object} props.connectionStatus - The connection status object.
 * @returns {object} The Admin component.
 */
const Admin = props => {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const { hasIDC, canManageConnection, isSafeModeConfirmed } = useSelect(
		select => select( STORE_ID ).getIDCData(),
		[]
	);

	const { connectionStatus } = props;

	useEffect( () => {
		restApi.setApiRoot( APIRoot );
		restApi.setApiNonce( APINonce );
	}, [ APIRoot, APINonce ] );

	return (
		<React.Fragment>
			{ ( ! hasIDC || isSafeModeConfirmed ) && <Header /> }

			{ ( ! hasIDC || isSafeModeConfirmed ) &&
				canManageConnection &&
				connectionStatus.isRegistered && (
					<ConnectionStatusCard
						apiRoot={ APIRoot }
						apiNonce={ APINonce }
						redirectUri="tools.php?page=wpcom-connection-manager"
					/>
				) }

			{ ( ! hasIDC || isSafeModeConfirmed ) &&
				canManageConnection &&
				! connectionStatus.isRegistered && (
					<ConnectScreenRequiredPlan
						connectionStatus={ connectionStatus }
						apiRoot={ APIRoot }
						apiNonce={ APINonce }
						registrationNonce={ registrationNonce }
						from="connection-ui"
						redirectUri="tools.php?page=wpcom-connection-manager"
						pricingIcon="data:image/svg+xml,%3Csvg width='32' height='32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m21.092 15.164.019-1.703v-.039c0-1.975-1.803-3.866-4.4-3.866-2.17 0-3.828 1.351-4.274 2.943l-.426 1.524-1.581-.065a2.92 2.92 0 0 0-.12-.002c-1.586 0-2.977 1.344-2.977 3.133 0 1.787 1.388 3.13 2.973 3.133H22.399c1.194 0 2.267-1.016 2.267-2.4 0-1.235-.865-2.19-1.897-2.368l-1.677-.29Zm-10.58-3.204a4.944 4.944 0 0 0-.201-.004c-2.75 0-4.978 2.298-4.978 5.133s2.229 5.133 4.978 5.133h12.088c2.357 0 4.267-1.97 4.267-4.4 0-2.18-1.538-3.99-3.556-4.339v-.06c0-3.24-2.865-5.867-6.4-5.867-2.983 0-5.49 1.871-6.199 4.404Z' fill='%23000'/%3E%3C/svg%3E"
						priceBefore={ 9 }
						priceAfter={ 4.5 }
						pricingTitle={ __( 'Jetpack Backup', 'jetpack-connection-ui' ) }
						buttonLabel={ __( 'Get Jetpack Backup', 'jetpack-connection-ui' ) }
					>
						<p>
							{ __(
								"Secure and speed up your site for free with Jetpack's powerful WordPress tools.",
								'jetpack-connection-ui'
							) }
						</p>

						<ul>
							<li>{ __( 'Measure your impact with beautiful stats', 'jetpack-connection-ui' ) }</li>
							<li>{ __( 'Speed up your site with optimized images', 'jetpack-connection-ui' ) }</li>
							<li>{ __( 'Protect your site against bot attacks', 'jetpack-connection-ui' ) }</li>
							<li>
								{ __( 'Get notifications if your site goes offline', 'jetpack-connection-ui' ) }
							</li>
							<li>
								{ __( 'Enhance your site with dozens of other features', 'jetpack-connection-ui' ) }
							</li>
						</ul>
					</ConnectScreenRequiredPlan>
				) }

			{ ( ! hasIDC || isSafeModeConfirmed ) && ! canManageConnection && (
				<p>You need to be an admin to access this page.</p>
			) }
		</React.Fragment>
	);
};

export default withSelect( select => {
	return {
		connectionStatus: select( CONNECTION_STORE_ID ).getConnectionStatus(),
	};
} )( Admin );

/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConnectButton from '../../connect-button';
import ConnectScreenVisual from './visual';
import { STORE_ID } from '../../../state/store';

/**
 * The Connection Screen component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const ConnectScreen = props => {
	const {
		title,
		buttonLabel,
		apiRoot,
		apiNonce,
		registrationNonce,
		from,
		redirectUri,
		images,
		children,
		assetBaseUrl,
		autoTrigger,
	} = props;

	const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );

	const renderConnectBtn = useCallback(
		( label, trigger ) => {
			return (
				<ConnectButton
					autoTrigger={ trigger }
					apiRoot={ apiRoot }
					apiNonce={ apiNonce }
					registrationNonce={ registrationNonce }
					from={ from }
					redirectUri={ redirectUri }
					connectionStatus={ connectionStatus }
					connectLabel={ label }
				/>
			);
		},
		[ apiRoot, apiNonce, registrationNonce, from, redirectUri, connectionStatus ]
	);

	return (
		<ConnectScreenVisual
			title={ title }
			autoTrigger={ autoTrigger }
			buttonLabel={ buttonLabel }
			images={ images }
			assetBaseUrl={ assetBaseUrl }
			isLoading={ ! connectionStatus.hasOwnProperty( 'isRegistered' ) }
			renderConnectBtn={ renderConnectBtn }
		>
			{ children }
		</ConnectScreenVisual>
	);
};

ConnectScreen.propTypes = {
	/** The Title. */
	title: PropTypes.string,
	/** The Connect Button label. */
	buttonLabel: PropTypes.string,
	/** API root. */
	apiRoot: PropTypes.string.isRequired,
	/** API nonce. */
	apiNonce: PropTypes.string.isRequired,
	/** Registration nonce. */
	registrationNonce: PropTypes.string.isRequired,
	/** Where the connection request is coming from. */
	from: PropTypes.string,
	/** The redirect admin URI. */
	redirectUri: PropTypes.string.isRequired,
	/** Whether to initiate the connection process automatically upon rendering the component. */
	autoTrigger: PropTypes.bool,
	/** Images to display on the right side. */
	images: PropTypes.arrayOf( PropTypes.string ),
	/** The assets base URL. */
	assetBaseUrl: PropTypes.string,
};

ConnectScreen.defaultProps = {
	title: __( 'Over 5 million WordPress sites are faster and more secure', 'jetpack' ),
	buttonLabel: __( 'Set up Jetpack', 'jetpack' ),
	images: [],
	redirectUri: null,
	autoTrigger: false,
};

export default ConnectScreen;

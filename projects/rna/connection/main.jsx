/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ConnectButton from './components/connect-button';
import InPlaceConnection from './components/in-place-connection';
import './style.scss';
import { restApi } from '@automattic/jetpack-components';

const Main = props => {
	const [ isConnecting, setIsConnecting ] = useState( false );

	useEffect( () => {
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
	}, [] );

	const onComplete = useCallback( () => {
		setIsConnecting( false );
	}, [ setIsConnecting ] );

	const onConnect = useCallback(
		e => {
			if ( ! props.useCalypsoFlow ) {
				setIsConnecting( true );
				e.preventDefault();
			}
		},
		[ setIsConnecting, props.useCalypsoFlow ]
	);

	return (
		<div className="jp-connection-main">
			{ ! isConnecting && (
				<ConnectButton
					connectUrl={ props.connectUrl }
					label={ props.label }
					onClick={ onConnect }
				/>
			) }

			{ isConnecting && (
				<InPlaceConnection
					connectUrl={ props.connectUrl }
					title={ props.inPlaceTitle }
					hasConnectedOwner={ props.hasConnectedOwner }
					onComplete={ onComplete }
				/>
			) }
		</div>
	);
};

Main.propTypes = {
	connectUrl: PropTypes.string.required,
	label: PropTypes.string,
	inPlaceTitle: PropTypes.string,
	useCalypsoFlow: PropTypes.bool,
	apiRoot: PropTypes.string.required,
	apiNonce: PropTypes.string.required,
};

Main.defaultProps = {
	inPlaceTitle: __( 'Connect your WordPress.com account', 'jetpack' ),
	useCalypsoFlow: false,
};

export default Main;

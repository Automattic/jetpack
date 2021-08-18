/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { __, sprintf } from '@wordpress/i18n';
import { ConnectUser } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import ConnectButton from 'components/connect-button';
import Card from 'components/card';
import analytics from 'lib/analytics';
import { getConnectUrl } from 'state/connection';
import './style.scss';

const ConnectUserBar = props => {
	const [ isConnecting, setIsConnecting ] = useState( false );
	const { connectUrl, feature, text } = props;

	const customConnect = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'connection-bar-click',
			feature: feature,
			is_user_wpcom_connected: 'no',
			is_connection_owner: 'no',
		} );

		setIsConnecting( true );
	}, [ setIsConnecting, feature ] );

	return (
		<Card compact className="jp-connect-user-bar__card">
			<div className="jp-connect-user-bar__text">
				{ sprintf(
					/* translators: placeholder is text adding extra instructions on what to do next. */
					__( 'This feature is provided by the WordPress.com cloud. %s', 'jetpack' ),
					text
				) }
			</div>

			<div className="jp-connect-user-bar__button">
				<ConnectButton
					connectUser={ true }
					from="unlinked-user-connect"
					connectLegend={ __( 'Connect your WordPress.com account', 'jetpack' ) }
					customConnect={ customConnect }
					isAuthorizing={ isConnecting }
				/>
			</div>

			{ isConnecting && <ConnectUser connectUrl={ connectUrl } /> }
		</Card>
	);
};

ConnectUserBar.propTypes = {
	text: PropTypes.string.isRequired,
	feature: PropTypes.string,
};

export default connect( state => {
	return {
		connectUrl: getConnectUrl( state ),
	};
} )( ConnectUserBar );

/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConnectButton from 'components/connect-button';
import ConnectUserFrame from 'components/connect-user-frame';
import Card from 'components/card';
import analytics from 'lib/analytics';
import './style.scss';

const ConnectUserBar = props => {
	const [ showConnect, setShowConnect ] = useState( false );

	const customConnect = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'connection-bar-click',
			feature: props.feature,
			is_user_wpcom_connected: 'no',
			is_connection_owner: 'no',
		} );

		setShowConnect( true );
	}, [ setShowConnect, props.feature ] );

	return (
		<Card compact className="jp-connect-user-bar__card">
			{ ! showConnect && (
				<div className="jp-connect-user-bar__text">
					{ sprintf(
						/* translators: placeholder is text adding extra instructions on what to do next. */
						__( 'This feature is provided by the WordPress.com cloud. %s', 'jetpack' ),
						props.text
					) }
				</div>
			) }
			{ ! showConnect && (
				<div className="jp-connect-user-bar__button">
					<ConnectButton
						connectUser={ true }
						from="unlinked-user-connect"
						connectLegend={ __( 'Connect your WordPress.com account', 'jetpack' ) }
						customConnect={ customConnect }
					/>
				</div>
			) }
			{ showConnect && (
				<ConnectUserFrame source="connect-user-bar" featureLabel={ props.featureLabel } />
			) }
		</Card>
	);
};

ConnectUserBar.propTypes = {
	text: PropTypes.string.isRequired,
	feature: PropTypes.string,
	featureLabel: PropTypes.string,
};

export default ConnectUserBar;

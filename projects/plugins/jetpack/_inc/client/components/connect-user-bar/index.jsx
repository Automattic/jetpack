/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConnectButton from 'components/connect-button';
import Card from 'components/card';
import analytics from 'lib/analytics';
import { connectUser } from 'state/connection';
import './style.scss';

const ConnectUserBar = props => {
	const { feature, text, doConnectUser } = props;

	const customConnect = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'connection-bar-click',
			feature: feature,
			is_user_wpcom_connected: 'no',
			is_connection_owner: 'no',
		} );

		doConnectUser();
	}, [ doConnectUser, feature ] );

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
				/>
			</div>
		</Card>
	);
};

ConnectUserBar.propTypes = {
	text: PropTypes.string.isRequired,
	feature: PropTypes.string,
};

export default connect( null, dispatch => ( {
	doConnectUser: () => {
		return dispatch( connectUser() );
	},
} ) )( ConnectUserBar );

import { __, sprintf } from '@wordpress/i18n';
import Card from 'components/card';
import ConnectButton from 'components/connect-button';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { connectUser } from 'state/connection';
import './style.scss';

const ConnectUserBar = props => {
	const { feature, featureLabel, text, doConnectUser } = props;

	const customConnect = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'connection-bar-click',
			feature: feature,
			is_user_wpcom_connected: 'no',
			is_connection_owner: 'no',
		} );

		doConnectUser( featureLabel );
	}, [ doConnectUser, feature, featureLabel ] );

	return (
		<Card compact className="jp-connect-user-bar__card">
			<div className="jp-connect-user-bar__text">
				{ sprintf(
					/* translators: placeholder is text adding extra instructions on what to do next. */
					__( 'This feature is provided by the Jetpack cloud. %s', 'jetpack' ),
					text
				) }
			</div>

			<div className="jp-connect-user-bar__button">
				<ConnectButton
					connectUser={ true }
					from="unlinked-user-connect"
					connectLegend={ __( 'Connect your Jetpack account', 'jetpack' ) }
					customConnect={ customConnect }
				/>
			</div>
		</Card>
	);
};

ConnectUserBar.propTypes = {
	text: PropTypes.string.isRequired,
	feature: PropTypes.string,
	featureLabel: PropTypes.string,
};

export default connect( null, dispatch => ( {
	doConnectUser: featureLabel => {
		return dispatch( connectUser( featureLabel ) );
	},
} ) )( ConnectUserBar );

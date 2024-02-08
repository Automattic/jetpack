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

	const from = 'unlinked-user-connect';

	const customConnect = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'connection-bar-click',
			feature: feature,
			is_user_wpcom_connected: 'no',
			is_connection_owner: 'no',
		} );

		doConnectUser( featureLabel, from );
	}, [ doConnectUser, feature, featureLabel, from ] );

	return (
		<Card compact className="jp-connect-user-bar__card">
			<span>
				{ sprintf(
					/* translators: placeholder is text adding extra instructions on what to do next. */
					__( 'This feature is provided by the WordPress.com cloud. %s', 'jetpack' ),
					text
				) }
			</span>

			<ConnectButton
				connectUser={ true }
				from={ from }
				connectLegend={ __( 'Connect your WordPress.com account', 'jetpack' ) }
				customConnect={ customConnect }
				rna={ true }
				compact={ true }
			/>
		</Card>
	);
};

ConnectUserBar.propTypes = {
	text: PropTypes.string.isRequired,
	feature: PropTypes.string,
	featureLabel: PropTypes.string,
};

export default connect( null, dispatch => ( {
	doConnectUser: ( featureLabel, from ) => dispatch( connectUser( featureLabel, from ) ),
} ) )( ConnectUserBar );

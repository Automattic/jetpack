/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConnectButton from 'components/connect-button';
import Card from 'components/card';
import './style.scss';

const ConnectUserBar = props => {
	return (
		<Card compact className="jp-connect-user-bar__card">
			<div className="jp-connect-user-bar__text">{ props.text }</div>
			<div className="jp-connect-user-bar__button">
				<ConnectButton
					connectUser={ true }
					from="unlinked-user-connect"
					connectLegend={ __( 'Connect my user account', 'jetpack' ) }
				/>
			</div>
		</Card>
	);
};

ConnectUserBar.propTypes = {
	text: PropTypes.string.isRequired,
};

export default ConnectUserBar;

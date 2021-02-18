/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConnectButton from 'components/connect-button';
import ConnectUserFrame from 'components/connect-user-frame';
import Card from 'components/card';
import './style.scss';

const ConnectUserBar = props => {
	const [ showConnect, setShowConnect ] = useState( false );

	const customConnect = useCallback( () => {
		setShowConnect( true );
	}, [ setShowConnect ] );

	return (
		<Card compact className="jp-connect-user-bar__card">
			{ ! showConnect && <div className="jp-connect-user-bar__text">{ props.text }</div> }
			{ ! showConnect && (
				<div className="jp-connect-user-bar__button">
					<ConnectButton
						connectUser={ true }
						from="unlinked-user-connect"
						connectLegend={ __( 'Connect my user account', 'jetpack' ) }
						customConnect={ customConnect }
					/>
				</div>
			) }
			{ showConnect && <ConnectUserFrame /> }
		</Card>
	);
};

ConnectUserBar.propTypes = {
	text: PropTypes.string.isRequired,
};

export default ConnectUserBar;

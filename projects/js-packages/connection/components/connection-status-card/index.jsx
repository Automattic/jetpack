/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

const ConnectionStatusCard = props => {
	const { isRegistered, isUserConnected } = props;

	return (
		<div className="jp-connection-status-card">
			<h3>Connection</h3>

			<p>
				Leverages the Jetpack Cloud for more features on your side.
				<br />
				<a href="#">Disconnect</a>
			</p>

			<div className="jp-connection-status-card--status">
				<div className="jp-connection-status-card--cloud"></div>
				<div
					className={
						'jp-connection-status-card--line' +
						( isUserConnected ? '' : ' jp-connection-status-card--site-only' )
					}
				></div>
				<div className="jp-connection-status-card--jetpack-logo"></div>
			</div>

			<ul className="jp-connection-status-card--list">
				{ isRegistered && <li>Site connected</li> }
				{ isRegistered && isUserConnected && <li>Logged in as username</li> }
			</ul>
		</div>
	);
};

export default ConnectionStatusCard;

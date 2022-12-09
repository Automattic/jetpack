import { ExternalLink, Tooltip } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import usePublicizeConfig from '../../hooks/use-publicize-config';

import './style.scss';

const ConnectionCount = props => {
	const { followerCount } = props;
	const { connectionsAdminUrl } = usePublicizeConfig();
	const refreshConnections = useDispatch( 'jetpack/publicize' ).refreshConnectionTestResults;

	const openConnectionsAdmin = useCallback(
		event => {
			event.preventDefault();

			const popupWin = window.open( connectionsAdminUrl, 'connections-admin', '' );
			const popupTimer = window.setInterval( () => {
				if ( false !== popupWin.closed ) {
					window.clearInterval( popupTimer );
					refreshConnections();
				}
			}, 500 );
		},
		[ connectionsAdminUrl, refreshConnections ]
	);

	return (
		<span className="jetpack-publicize-connection-label-follower-count">
			{ followerCount >= 0 ? (
				followerCount.toLocaleString()
			) : (
				<Tooltip
					text={ __(
						'You need to disconnect and reconnect this service to see the follower count.',
						'jetpack'
					) }
				>
					<ExternalLink href="#" onClick={ openConnectionsAdmin }>
						{ __( 'Fix', 'jetpack' ) }
					</ExternalLink>
				</Tooltip>
			) }
		</span>
	);
};

ConnectionCount.propTypes = {
	followerCount: PropTypes.number,
};

export default ConnectionCount;

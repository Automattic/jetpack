import { ExternalLink, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import usePublicizeConfig from '../../hooks/use-publicize-config';

import './style.scss';

const ConnectionCount = props => {
	const { followerCount } = props;
	const { connectionsAdminUrl } = usePublicizeConfig();

	return (
		<span className="jetpack-publicize-connection-label-follower-count">
			{ followerCount ? (
				followerCount.toLocaleString()
			) : (
				<Tooltip
					text={ __(
						'You need to disconnect and reconnect this service to see the follower count.',
						'jetpack'
					) }
				>
					<ExternalLink href={ connectionsAdminUrl }>{ __( 'Fix', 'jetpack' ) }</ExternalLink>
				</Tooltip>
			) }
		</span>
	);
};

ConnectionCount.propTypes = {
	followerCount: PropTypes.number,
};

export default ConnectionCount;

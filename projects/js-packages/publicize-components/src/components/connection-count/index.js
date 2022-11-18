import PropTypes from 'prop-types';

import './style.scss';

// convert to friendly number
const friendlyNumber = number => {
	if ( number >= 1000000 ) {
		return `${ ( number / 1000000 ).toFixed( 1 ) }M`;
	}
	if ( number >= 1000 ) {
		return `${ ( number / 1000 ).toFixed( 1 ) }K`;
	}
	return number;
};

const ConnectionCount = props => {
	const { followerCount } = props;

	return (
		<span className="jetpack-publicize-connection-label-follower-count">
			{ followerCount ? friendlyNumber( followerCount ) : null }
		</span>
	);
};

ConnectionCount.propTypes = {
	followerCount: PropTypes.number,
};

export default ConnectionCount;

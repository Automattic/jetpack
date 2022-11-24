import PropTypes from 'prop-types';
import './style.scss';

const ConnectionCount = props => {
	const { followerCount } = props;

	return (
		<span className="jetpack-publicize-connection-label-follower-count">
			{ followerCount ? followerCount.toLocaleString() : null }
		</span>
	);
};

ConnectionCount.propTypes = {
	followerCount: PropTypes.number,
};

export default ConnectionCount;

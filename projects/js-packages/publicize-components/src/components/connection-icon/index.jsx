import { SocialServiceIcon } from '@automattic/jetpack-components';
import PropTypes from 'prop-types';

import './style.scss';

const ConnectionIcon = props => {
	const { id, serviceName, label, profilePicture } = props;

	return (
		<label htmlFor={ id } className="jetpack-publicize-connection-label">
			<div className={ profilePicture ? 'components-connection-icon__picture' : '' }>
				{ profilePicture && <img src={ profilePicture } alt={ label } /> }
				<SocialServiceIcon
					serviceName={ serviceName }
					className="jetpack-publicize-gutenberg-social-icon"
				/>
			</div>
			<span className="jetpack-publicize-connection-label-copy">{ label }</span>
		</label>
	);
};

ConnectionIcon.propTypes = {
	id: PropTypes.string.isRequired,
	serviceName: PropTypes.string,
	label: PropTypes.string,
	profilePicture: PropTypes.string,
};

export default ConnectionIcon;

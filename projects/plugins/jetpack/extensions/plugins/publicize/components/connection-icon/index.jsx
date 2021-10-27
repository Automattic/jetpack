/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { SocialServiceIcon } from '../../../../shared/icons';

/**
 * Style dependencies
 */
import './style.scss';

const ConnectionIcon = props => {
	const { id, serviceName, label, profilePicture } = props;

	return (
		<label htmlFor={ id } className="jetpack-publicize-connection-label">
			<div className="components-connection-icon__picture">
				{ profilePicture ? (
					<img src={ profilePicture } alt={ label } />
				) : (
					<span className="placeholder" />
				) }
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

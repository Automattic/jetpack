import { useState } from '@wordpress/element';
import { SocialServiceIcon } from '@automattic/jetpack-components';
import PropTypes from 'prop-types';

import './style.scss';

const ConnectionIcon = props => {
	const { id, serviceName, label, profilePicture } = props;
	const [ isPictureLoaded, setIsPictureLoaded ] = useState( false );
	const [ displayPicture, setDisplayPicture ] = useState( !! profilePicture );

	return (
		<label htmlFor={ id } className="jetpack-publicize-connection-label">
			<div className={ isPictureLoaded ? 'components-connection-icon__picture' : '' }>
				{ displayPicture && (
					<img
						src={ profilePicture }
						alt={ label }
						onLoad={ () => setIsPictureLoaded( true ) }
						onError={ () => setDisplayPicture( false ) }
					/>
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

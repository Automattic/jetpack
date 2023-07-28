import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import PropTypes from 'prop-types';

import './style.scss';

const ConnectionIcon = props => {
	const { serviceName, label, profilePicture } = props;
	const [ hasDisplayPicture, setHasDisplayPicture ] = useState( !! profilePicture );

	const onError = useCallback( () => setHasDisplayPicture( false ), [] );

	return (
		<div className={ hasDisplayPicture ? 'components-connection-icon__picture' : '' }>
			{ hasDisplayPicture && <img src={ profilePicture } alt={ label } onError={ onError } /> }
			<SocialServiceIcon
				serviceName={ 'instagram-business' === serviceName ? 'instagram' : serviceName }
				className="jetpack-publicize-gutenberg-social-icon"
				invert={ 'tumblr' === serviceName }
			/>
		</div>
	);
};

ConnectionIcon.propTypes = {
	serviceName: PropTypes.string,
	label: PropTypes.string,
	profilePicture: PropTypes.string,
};

export default ConnectionIcon;

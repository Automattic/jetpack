import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import PropTypes from 'prop-types';

import './style.scss';

const ConnectionIcon = props => {
	const { checked, serviceName, label, onClick, profilePicture } = props;
	const [ hasDisplayPicture, setHasDisplayPicture ] = useState( !! profilePicture );

	const onError = useCallback( () => setHasDisplayPicture( false ), [] );

	const handleKeyDown = useCallback(
		ev => {
			if ( ev.keyCode === 13 ) {
				onClick();
			}
		},
		[ onClick ]
	);

	return (
		<div
			onClick={ onClick }
			onKeyDown={ handleKeyDown }
			role="switch"
			aria-checked={ checked }
			tabindex="0"
			className={ hasDisplayPicture ? 'components-connection-icon__picture' : '' }
		>
			{ hasDisplayPicture && <img src={ profilePicture } alt={ label } onError={ onError } /> }
			<SocialServiceIcon
				alt={ label }
				serviceName={ 'instagram-business' === serviceName ? 'instagram' : serviceName }
				className="jetpack-publicize-gutenberg-social-icon"
				invert={ 'tumblr' === serviceName }
			/>
		</div>
	);
};

ConnectionIcon.propTypes = {
	id: PropTypes.string.isRequired,
	serviceName: PropTypes.string,
	label: PropTypes.string,
	profilePicture: PropTypes.string,
};

export default ConnectionIcon;

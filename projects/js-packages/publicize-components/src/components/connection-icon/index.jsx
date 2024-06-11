import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import clsx from 'clsx';
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

	const getServiceName = () => {
		if ( 'instagram-business' === serviceName ) {
			return 'instagram';
		}

		if ( 'twitter' === serviceName ) {
			return 'x';
		}

		return serviceName;
	};

	return (
		<div
			onClick={ onClick }
			onKeyDown={ handleKeyDown }
			role="switch"
			aria-checked={ checked }
			tabIndex="0"
			className={ clsx( 'components-connection-icon', {
				'components-connection-icon__picture': hasDisplayPicture,
			} ) }
		>
			{ hasDisplayPicture && <img src={ profilePicture } alt={ label } onError={ onError } /> }
			<SocialServiceIcon
				alt={ label }
				serviceName={ getServiceName() }
				className="jetpack-publicize-gutenberg-social-icon"
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

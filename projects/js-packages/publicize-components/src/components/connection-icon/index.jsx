import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import PropTypes from 'prop-types';

import './style.scss';

const ConnectionIcon = props => {
	const { id, serviceName, label, profilePicture } = props;
	const [ hasDisplayPicture, setHasDisplayPicture ] = useState( !! profilePicture );

	const onError = useCallback( () => setHasDisplayPicture( false ), [] );

	return (
		<label htmlFor={ id } className="jetpack-publicize-connection-label">
			<div className={ hasDisplayPicture ? 'components-connection-icon__picture' : '' }>
				{ hasDisplayPicture && <img src={ profilePicture } alt={ label } onError={ onError } /> }
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

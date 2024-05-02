import { Button } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { requestExternalAccess } from '../../utils/request-external-access.js';

const ConnectButton = ( { connectUrl, onClose, className = null, size = 'normal' } ) => {
	const requestConnection = useCallback(
		() => requestExternalAccess( connectUrl, onClose ),
		[ connectUrl, onClose ]
	);
	return (
		<Button className={ className } variant="primary" onClick={ requestConnection } size={ size }>
			{ __( 'Connect', 'jetpack' ) }
		</Button>
	);
};

export default ConnectButton;

import { Button } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { requestExternalAccess } from '../../utils/request-external-access.js';

type ConnectButtonProps = {
	connectUrl: string;
	onConfirm: ( data: unknown ) => void;
	className?: string;
	size?: 'small' | 'normal' | 'large';
};

const ConnectButton = ( {
	connectUrl,
	onConfirm,
	className = null,
	size = 'normal',
}: ConnectButtonProps ) => {
	const requestConnection = useCallback(
		() => requestExternalAccess( connectUrl, onConfirm ),
		[ connectUrl, onConfirm ]
	);
	return (
		<Button className={ className } variant="primary" onClick={ requestConnection } size={ size }>
			{ __( 'Connect', 'jetpack' ) }
		</Button>
	);
};

export default ConnectButton;

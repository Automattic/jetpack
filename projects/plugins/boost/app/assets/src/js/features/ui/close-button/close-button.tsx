import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton } from '@wordpress/ui';
import styles from './close-button.module.scss';

const CloseButton = ( { onClick }: { onClick: () => void } ) => {
	return (
		<IconButton
			label={ __( 'Dismiss', 'jetpack-boost' ) }
			icon={ close }
			variant="minimal"
			tone="neutral"
			size="small"
			className={ styles.close }
			onClick={ onClick }
		/>
	);
};

export default CloseButton;

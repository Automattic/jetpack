import { __ } from '@wordpress/i18n';
import LeftArrow from '$svg/left-arrow';
import { useBackToSettings } from '$lib/navigation/use-back-to-settings';
import { Button } from '@automattic/jetpack-components';
import styles from './back-button.module.scss';
import type { FC } from 'react';

const BackButton: FC = () => {
	const { onClick } = useBackToSettings( 'back_button' );

	return (
		<Button variant="link" className={ styles[ 'back-button' ] } onClick={ onClick }>
			<LeftArrow />
			{ __( 'Go back', 'jetpack-boost' ) }
		</Button>
	);
};

export default BackButton;

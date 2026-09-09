import { __ } from '@wordpress/i18n';
import LeftArrow from '$svg/left-arrow';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useBoostNavigation } from '$lib/navigation/navigation-context';
import { Button } from '@automattic/jetpack-components';
import styles from './back-button.module.scss';
import type { FC } from 'react';

const BackButton: FC = () => {
	const { returnToSettings } = useBoostNavigation();
	const handleBack = () => {
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: '/',
		} );
		returnToSettings();
	};

	return (
		<Button variant="link" className={ styles[ 'back-button' ] } onClick={ handleBack }>
			<LeftArrow />
			{ __( 'Go back', 'jetpack-boost' ) }
		</Button>
	);
};

export default BackButton;

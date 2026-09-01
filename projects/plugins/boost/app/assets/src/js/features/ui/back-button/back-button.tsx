import { __ } from '@wordpress/i18n';
import LeftArrow from '$svg/left-arrow';
import { useNavigate } from 'react-router';
import { recordBoostEvent } from '$lib/utils/analytics';
import { Button } from '@automattic/jetpack-components';
import styles from './back-button.module.scss';
import type { FC } from 'react';

type BackButtonProps = {
	route?: string;
};

const BackButton: FC< BackButtonProps > = ( { route = '/' } ) => {
	const navigate = useNavigate();
	const handleBack = () => {
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: route,
		} );
		navigate( route );
	};

	return (
		<Button variant="link" className={ styles[ 'back-button' ] } onClick={ handleBack }>
			<LeftArrow />
			{ __( 'Go back', 'jetpack-boost' ) }
		</Button>
	);
};

export default BackButton;

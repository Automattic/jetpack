import { Container, Col, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useCallback, useEffect, useState } from 'react';
import useWelcomeBanner from '../../data/welcome-banner/use-welcome-banner';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { CardWrapper } from '../card';
import ConnectionStep from './ConnectionStep';
import styles from './style.module.scss';
import type { FC } from 'react';

const WelcomeFlow: FC = () => {
	const { recordEvent } = useAnalytics();
	const { isWelcomeBannerVisible, dismissWelcomeBanner } = useWelcomeBanner();
	const { siteIsRegistered, siteIsRegistering, handleRegisterSite } = useMyJetpackConnection( {
		skipUserConnection: true,
	} );
	const [ visible, setVisible ] = useState( isWelcomeBannerVisible );

	const onDismissClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_dismiss_click' );
		setVisible( false );
		dismissWelcomeBanner();
	}, [ recordEvent, dismissWelcomeBanner ] );

	useEffect( () => {
		// TODO: It's a temporary code instead of Survey step
		if ( siteIsRegistered && visible ) {
			setVisible( false );
			dismissWelcomeBanner();
		}
	}, [ visible, siteIsRegistered, dismissWelcomeBanner ] );

	if ( ! visible ) {
		return null;
	}

	return (
		<Container horizontalSpacing={ 3 } className={ styles[ 'banner-container' ] }>
			<Col lg={ 12 } className={ styles.banner }>
				<CardWrapper className={ styles[ 'banner-card' ] }>
					<Container
						horizontalSpacing={ 0 }
						horizontalGap={ 0 }
						className={ styles[ 'banner-content' ] }
					>
						<ConnectionStep
							onActivateSite={ handleRegisterSite }
							isActivating={ siteIsRegistering }
						/>
					</Container>
				</CardWrapper>
				<Button
					className={ styles.dismiss }
					variant="secondary"
					aria-label={ __( 'Don’t show the welcome message again', 'jetpack-my-jetpack' ) }
					size="small"
					icon={ close }
					disabled={ siteIsRegistering }
					onClick={ onDismissClick }
				/>
			</Col>
		</Container>
	);
};

export default WelcomeFlow;

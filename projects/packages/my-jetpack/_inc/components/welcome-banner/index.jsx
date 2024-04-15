import { Container, Col, Button, Text } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useEffect, useCallback, useState } from 'react';
import { MyJetpackRoutes } from '../../constants';
import useWelcomeBanner from '../../data/welcome-banner/use-welcome-banner';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { CardWrapper } from '../card';
import styles from './style.module.scss';

/**
 * Component that renders the Welcome banner on My Jetpack.
 *
 * @returns {object} The WelcomeBanner component.
 */
const WelcomeBanner = () => {
	const { recordEvent } = useAnalytics();
	const { isWelcomeBannerVisible, dismissWelcomeBanner } = useWelcomeBanner();
	const { isRegistered, isUserConnected } = useConnection();
	const navigateToConnectionPage = useMyJetpackNavigate( MyJetpackRoutes.Connection );
	const [ bannerVisible, setBannerVisible ] = useState( isWelcomeBannerVisible );
	const shouldDisplayConnectionButton = ! isRegistered || ! isUserConnected;

	useEffect( () => {
		if ( bannerVisible ) {
			recordEvent( 'jetpack_myjetpack_welcome_banner_view' );
		}
	}, [ bannerVisible, recordEvent ] );

	const onDismissClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_dismiss_click' );
		setBannerVisible( false );
		dismissWelcomeBanner();
	}, [ recordEvent, dismissWelcomeBanner ] );

	const onFinishConnectionClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_finish_connection_click' );
		navigateToConnectionPage();
	}, [ recordEvent, navigateToConnectionPage ] );

	if ( ! bannerVisible ) {
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
						<Col sm={ 6 } md={ 8 } lg={ 6 } className={ styles[ 'banner-description' ] }>
							<Text variant="headline-small" mb={ 3 }>
								{ __( 'Welcome to Jetpack!', 'jetpack-my-jetpack' ) }
							</Text>
							<Text variant="body" mb={ 2 }>
								{ __(
									'Jetpack is a suite of security, performance, and growth tools made for WordPress sites by the WordPress experts.',
									'jetpack-my-jetpack'
								) }
							</Text>
							<Text variant="body" mb={ shouldDisplayConnectionButton ? 4 : 0 }>
								{ __(
									'It’s the ultimate toolkit for best-in-class websites, with everything you need to grow your business. Choose a plan below to get started.',
									'jetpack-my-jetpack'
								) }
							</Text>
							{ shouldDisplayConnectionButton && (
								<Button variant="primary" onClick={ onFinishConnectionClick }>
									{ __( 'Finish setting up Jetpack', 'jetpack-my-jetpack' ) }
								</Button>
							) }
						</Col>
						<Col sm={ 6 } md={ 8 } lg={ 6 } className={ styles[ 'banner-image' ] }></Col>
					</Container>
				</CardWrapper>
				<Button
					className={ styles.dismiss }
					variant="secondary"
					aria-label={ __( 'Don’t show the welcome message again', 'jetpack-my-jetpack' ) }
					size="small"
					icon={ close }
					onClick={ onDismissClick }
				/>
			</Col>
		</Container>
	);
};

export default WelcomeBanner;

import { Container, Col, Button, Text, TermsOfService } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useEffect, useCallback, useState, useContext } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useWelcomeBanner from '../../data/welcome-banner/use-welcome-banner';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { CardWrapper } from '../card';
import styles from './style.module.scss';

/**
 * Component that renders the Welcome banner on My Jetpack.
 *
 * @returns {object} The WelcomeBanner component.
 */
const WelcomeBanner = () => {
	const { recordEvent } = useAnalytics();
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const { isWelcomeBannerVisible, dismissWelcomeBanner } = useWelcomeBanner();
	const { siteIsRegistered, siteIsRegistering, handleRegisterSite } = useMyJetpackConnection( {
		skipUserConnection: true,
	} );
	const [ bannerVisible, setBannerVisible ] = useState( isWelcomeBannerVisible );

	const connectionButtonLabel = __( 'Activate Jetpack in one click', 'jetpack-my-jetpack' );

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

	const onConnectSiteClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_finish_connection_click' );
		handleRegisterSite().then( () => {
			resetNotice();
			setNotice( {
				message: __( 'Your site has been successfully connected.', 'jetpack-my-jetpack' ),
				options: {
					id: 'site-connection-success-notice',
					level: 'success',
					actions: [],
					priority: NOTICE_PRIORITY_HIGH,
					hideCloseButton: false,
					onClose: resetNotice,
				},
			} );
		} );
	}, [ recordEvent, handleRegisterSite, resetNotice, setNotice ] );

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
									'Elevate your WordPress experience with Jetpack, the complete toolkit for enhancing your site’s security, speed, and reach.',
									'jetpack-my-jetpack'
								) }
							</Text>
							<Text variant="body" mb={ 2 }>
								{ __(
									'Jetpack works behind the scenes to keep your site safe, make it lightning-fast, and to help you get more traffic.',
									'jetpack-my-jetpack'
								) }
							</Text>
							{ ! siteIsRegistered && (
								<>
									<TermsOfService agreeButtonLabel={ connectionButtonLabel } mb={ 4 } />
									<Button variant="primary" onClick={ onConnectSiteClick }>
										{ siteIsRegistering
											? __( 'Activating…', 'jetpack-my-jetpack' )
											: connectionButtonLabel }
									</Button>
								</>
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

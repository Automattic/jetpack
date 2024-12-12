import { Col, Button, Text, TermsOfService, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';
import { NOTICE_SITE_CONNECTION_ERROR } from '../../context/notices/noticeTemplates';
import useProductsByOwnership from '../../data/products/use-products-by-ownership';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import styles from './style.module.scss';
import { WelcomeFlowExperiment } from '.';
import type { Dispatch, SetStateAction } from 'react';

type ConnectionStepProps = {
	onActivateSite: ( e?: Event ) => Promise< void >;
	onUpdateWelcomeFlowExperiment?: Dispatch< SetStateAction< WelcomeFlowExperiment > >;
	isActivating: boolean;
};

/**
 * Component that renders the Welcome banner on My Jetpack.
 *
 * @param {object}   props                - ConnectioStepProps
 * @param {Function} props.onActivateSite - Alias for handleRegisterSite
 * @param {boolean}  props.isActivating   - Alias for siteIsRegistering
 * @return {object} The ConnectionStep component.
 */
const ConnectionStep = ( { onActivateSite, isActivating }: ConnectionStepProps ) => {
	const { recordEvent } = useAnalytics();
	const { setNotice, resetNotice } = useContext( NoticeContext );

	const { siteSuffix, adminUrl } = getMyJetpackWindowInitialState();
	const connectAfterCheckoutUrl = `?connect_after_checkout=true&admin_url=${ encodeURIComponent(
		adminUrl
	) }&from_site_slug=${ siteSuffix }&source=my-jetpack`;
	const redirectUri = `&redirect_to=${ encodeURIComponent( window.location.href ) }`;
	const query = `${ connectAfterCheckoutUrl }${ redirectUri }&unlinked=1`;
	const jetpackPlansPath = getRedirectUrl( 'jetpack-my-jetpack-site-only-plans', { query } );

	const activationButtonLabel = __( 'Activate Jetpack in one click', 'jetpack-my-jetpack' );
	const { refetch: refetchOwnershipData } = useProductsByOwnership();

	const onConnectSiteClick = useCallback( async () => {
		resetNotice();

		recordEvent( 'jetpack_myjetpack_welcome_banner_connect_site_click' );

		try {
			await onActivateSite();

			recordEvent( 'jetpack_myjetpack_welcome_banner_connect_site_success' );

			// Redirect user to the plans page after connection
			window.location.href = jetpackPlansPath;
		} catch {
			setNotice( NOTICE_SITE_CONNECTION_ERROR, resetNotice );
		} finally {
			refetchOwnershipData();
		}
	}, [
		jetpackPlansPath,
		onActivateSite,
		recordEvent,
		refetchOwnershipData,
		resetNotice,
		setNotice,
	] );

	return (
		<>
			<Col sm={ 6 } md={ 8 } lg={ 6 } className={ styles[ 'banner-description' ] }>
				<Text variant="headline-small" mb={ 3 }>
					{ __( 'Welcome to Jetpack!', 'jetpack-my-jetpack' ) }
				</Text>
				<Text variant="body" mb={ 2 }>
					{ __(
						'Unlock the power of your WordPress site with Jetpack, the complete toolkit for enhancing your site’s security, speed, and growth.',
						'jetpack-my-jetpack'
					) }
				</Text>
				<Text variant="body" mb={ 2 }>
					{ __(
						'Jetpack works behind the scenes to keep your site safe, make it lightning-fast, and to help you get more traffic.',
						'jetpack-my-jetpack'
					) }
				</Text>
				<TermsOfService agreeButtonLabel={ activationButtonLabel } mb={ 4 } />
				<Button
					variant="primary"
					disabled={ isActivating }
					isLoading={ isActivating }
					onClick={ onConnectSiteClick }
				>
					{ isActivating ? __( 'Activating…', 'jetpack-my-jetpack' ) : activationButtonLabel }
				</Button>
			</Col>
			<Col sm={ 6 } md={ 8 } lg={ 6 } className={ styles[ 'banner-image' ] }></Col>
		</>
	);
};

export default ConnectionStep;

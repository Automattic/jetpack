import { Col, Button, Text, TermsOfService } from '@automattic/jetpack-components';
import { initializeExPlat, loadExperimentAssignment } from '@automattic/jetpack-explat';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';
import { NOTICE_SITE_CONNECTED } from '../../context/notices/noticeTemplates';
import useAnalytics from '../../hooks/use-analytics';
import sideloadTracks from '../../utils/side-load-tracks';
import styles from './style.module.scss';
import { WelcomeFlowExperiment } from '.';
import type { Dispatch, SetStateAction } from 'react';

type ConnectionStepProps = {
	onActivateSite: ( e?: Event ) => Promise< void >;
	onUpdateWelcomeFlowExperiment: Dispatch< SetStateAction< WelcomeFlowExperiment > >;
	isActivating: boolean;
};

/**
 * Component that renders the Welcome banner on My Jetpack.
 *
 * @param {object} props - ConnectioStepProps
 * @param {Function} props.onActivateSite - Alias for handleRegisterSite
 * @param {Function} props.onUpdateWelcomeFlowExperiment - Updating the welcomeFlowExperiment state
 * @param {boolean} props.isActivating - Alias for siteIsRegistering
 * @returns {object} The ConnectionStep component.
 */
const ConnectionStep = ( {
	onActivateSite,
	onUpdateWelcomeFlowExperiment,
	isActivating,
}: ConnectionStepProps ) => {
	const { recordEvent } = useAnalytics();
	const { setNotice, resetNotice } = useContext( NoticeContext );

	const activationButtonLabel = __( 'Activate Jetpack in one click', 'jetpack-my-jetpack' );

	const onConnectSiteClick = useCallback( async () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_connect_site_click' );
		onUpdateWelcomeFlowExperiment( state => ( { ...state, isLoading: true } ) );
		await onActivateSite();

		recordEvent( 'jetpack_myjetpack_welcome_banner_connect_site_success' );

		await sideloadTracks();

		initializeExPlat();

		const { variationName } = await loadExperimentAssignment(
			'jetpack_my_jetpack_post_connection_flow_202408'
		);

		onUpdateWelcomeFlowExperiment( state => ( {
			...state,
			variation: variationName as WelcomeFlowExperiment[ 'variation' ], // casting to 'control' or 'treatment'
		} ) );

		resetNotice();
		setNotice( NOTICE_SITE_CONNECTED, resetNotice );

		onUpdateWelcomeFlowExperiment( state => ( { ...state, isLoading: false } ) );
	}, [ onActivateSite, onUpdateWelcomeFlowExperiment, recordEvent, resetNotice, setNotice ] );

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

/*
 * External dependencies
 */
import {
	ActionButton,
	AdminPage,
	Col,
	Container,
	GlobalNotices,
	Notice,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { shouldUseInternalLinks } from '@automattic/jetpack-shared-extension-utils';
import { __, _x } from '@wordpress/i18n';
import clsx from 'clsx';
import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
/*
 * Internal dependencies
 */
import { NoticeContext } from '../../context/notices/noticeContext';
import { NOTICE_SITE_CONNECTION_ERROR } from '../../context/notices/noticeTemplates';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import useUpdateHistoricallyActiveModules from '../../data/products/use-update-historically-active-modules';
import useRedBubbleQuery from '../../data/use-red-bubble-query';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import onKeyDownCallback from '../../data/utils/onKeyDownCallback';
import resetJetpackOptions from '../../data/utils/reset-jetpack-options';
import useWelcomeBanner from '../../data/welcome-banner/use-welcome-banner';
import useAnalytics from '../../hooks/use-analytics';
import useIsJetpackUserNew from '../../hooks/use-is-jetpack-user-new';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useNotificationWatcher from '../../hooks/use-notification-watcher';
import { useQueryParameter } from '../../hooks/use-query-parameter';
import EvaluationRecommendations from '../evaluation-recommendations';
import IDCModal from '../idc-modal';
import { MyJetpackTabPanel } from '../my-jetpack-tab-panel';
import { MY_JETPACK_SECTION_OVERVIEW } from '../my-jetpack-tab-panel/constants';
import { isValidMyJetpackSection } from '../my-jetpack-tab-panel/utils';
import OnboardingTour from '../onboarding-tour';
import WelcomeFlow from '../welcome-flow';
import styles from './styles.module.scss';

const GlobalNotice = ( { message, title, options } ) => {
	const { recordEvent } = useAnalytics();
	useEffect( () => {
		const tracksArgs = options?.tracksArgs || {};

		recordEvent( 'jetpack_myjetpack_global_notice_view', {
			notice_id: options.id,
			...tracksArgs,
		} );
	}, [ options.id, recordEvent, options?.tracksArgs ] );

	const [ isBiggerThanMedium ] = useBreakpointMatch( [ 'md' ], [ '>' ] );

	const actionButtons = options.actions?.map( action => {
		return (
			<ActionButton key={ action.key || action.label } customClass={ styles.cta } { ...action } />
		);
	} );

	return (
		<div
			className={ clsx( styles.notice, {
				[ styles[ 'bigger-than-medium' ] ]: isBiggerThanMedium,
			} ) }
		>
			<Notice hideCloseButton={ true } { ...options } title={ title } actions={ actionButtons }>
				<div className={ styles.message }>{ message }</div>
			</Notice>
		</div>
	);
};

/**
 * The My Jetpack App Main Screen.
 *
 * @return {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	const [ welcomeFlowExperiment, setWelcomeFlowExperiment ] = useState( {
		isLoading: false,
		variation: 'control',
	} );
	useNotificationWatcher();
	const {
		// no prettier please
		adminUrl,
		sandboxedDomain,
		isDevVersion,
		userIsAdmin,
	} = getMyJetpackWindowInitialState();

	const { isWelcomeBannerVisible } = useWelcomeBanner();
	const { isSectionVisible } = useEvaluationRecommendations();
	const { siteIsRegistered, apiRoot, apiNonce } = useMyJetpackConnection();
	const { currentNotice } = useContext( NoticeContext );
	const {
		message: noticeMessage,
		title: noticeTitle,
		options: noticeOptions,
	} = currentNotice || {};

	const {
		data: redBubbleAlerts,
		isLoading: isRedBubbleAlertsLoading,
		isError: isRedBubbleAlertsError,
	} = useRedBubbleQuery();

	const updateHistoricallyActiveModules = useUpdateHistoricallyActiveModules();

	useEffect( () => {
		updateHistoricallyActiveModules();
	}, [ updateHistoricallyActiveModules ] );

	const isNewUser = useIsJetpackUserNew();

	const { recordEvent } = useAnalytics();
	const [ reloading, setReloading ] = useState( false );
	const params = useParams();
	const previousTabRef = useRef( null );

	// useLayoutEffect gets called before useEffect.
	// We are using it here to ensure the `page_view` event gets triggered first.
	// Determine current tab
	const currentTab = isValidMyJetpackSection( params.section )
		? params.section
		: MY_JETPACK_SECTION_OVERVIEW;

	useLayoutEffect( () => {
		let customTracksData = {};

		if ( ! isRedBubbleAlertsError && Object.keys( redBubbleAlerts )?.length ) {
			customTracksData = {
				red_bubble_alerts: Object.keys( redBubbleAlerts ).join( ',' ),
			};
		}

		if ( ! isRedBubbleAlertsLoading ) {
			recordEvent( 'jetpack_myjetpack_page_view', {
				...customTracksData,
				tab_name: currentTab,
				previous_tab: previousTabRef.current,
			} );

			// Update previous tab for next navigation
			previousTabRef.current = currentTab;
		}
	}, [
		recordEvent,
		redBubbleAlerts,
		isRedBubbleAlertsError,
		isRedBubbleAlertsLoading,
		currentTab,
	] );

	if ( window.location.hash.includes( '?reload=true' ) ) {
		// Clears the query string and reloads the page.
		window.history.replaceState( null, '', window.location.href.replace( '?reload=true', '' ) );
		window.location.reload();

		setReloading( true );
	}

	// show welcome tour if user is redirected from the onboarding flow
	const isRedirectingFromOnboarding = useQueryParameter( 'from' ) === 'jetpack-onboarding';

	if ( reloading ) {
		return null;
	}

	const resetOptionsMenuItem = {
		label: _x(
			'Reset Options (dev only)',
			'Button for option to reset Jetpack Options',
			'jetpack-my-jetpack'
		),
		title: __( 'Reset Options', 'jetpack-my-jetpack' ),
		role: 'button',
		onClick: () => resetJetpackOptions(),
		onKeyDown: e => onKeyDownCallback( e, () => resetJetpackOptions() ),
	};

	return (
		<AdminPage
			siteAdminUrl={ adminUrl }
			sandboxedDomain={ sandboxedDomain }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			optionalMenuItems={ isDevVersion && userIsAdmin ? [ resetOptionsMenuItem ] : [] }
			useInternalLinks={ shouldUseInternalLinks() }
			className={ styles[ 'my-jetpack-screen' ] }
		>
			<h1 className="screen-reader-text">{ __( 'My Jetpack', 'jetpack-my-jetpack' ) }</h1>

			<IDCModal />
			<GlobalNotices />
			{ ! isNewUser && (
				<Container horizontalSpacing={ 0 }>
					<Col>
						<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
					</Col>
				</Container>
			) }
			{ isWelcomeBannerVisible && userIsAdmin ? (
				<WelcomeFlow
					welcomeFlowExperiment={ welcomeFlowExperiment }
					setWelcomeFlowExperiment={ setWelcomeFlowExperiment }
				>
					{ noticeMessage &&
						( siteIsRegistered ||
							noticeOptions?.id === NOTICE_SITE_CONNECTION_ERROR.options.id ) && (
							<GlobalNotice
								message={ noticeMessage }
								title={ noticeTitle }
								options={ noticeOptions }
							/>
						) }
				</WelcomeFlow>
			) : (
				noticeMessage && (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col>
							<GlobalNotice
								message={ noticeMessage }
								title={ noticeTitle }
								options={ noticeOptions }
							/>
						</Col>
					</Container>
				)
			) }
			{ ! isWelcomeBannerVisible && isSectionVisible && userIsAdmin && (
				<EvaluationRecommendations />
			) }

			{ isRedirectingFromOnboarding && <OnboardingTour /> }

			<MyJetpackTabPanel />
		</AdminPage>
	);
}

/*
 * External dependencies
 */
import {
	AdminSection,
	AdminPage,
	Container,
	Col,
	Notice,
	ZendeskChat,
	useBreakpointMatch,
	ActionButton,
} from '@automattic/jetpack-components';
import { useExperiment } from '@automattic/jetpack-explat';
import clsx from 'clsx';
import { useContext, useEffect, useLayoutEffect, useState } from 'react';
/*
 * Internal dependencies
 */
import { NoticeContext } from '../../context/notices/noticeContext';
import {
	REST_API_CHAT_AUTHENTICATION_ENDPOINT,
	REST_API_CHAT_AVAILABILITY_ENDPOINT,
	QUERY_CHAT_AVAILABILITY_KEY,
	QUERY_CHAT_AUTHENTICATION_KEY,
} from '../../data/constants';
import useSimpleQuery from '../../data/use-simple-query';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useWelcomeBanner from '../../data/welcome-banner/use-welcome-banner';
import useAnalytics from '../../hooks/use-analytics';
import useNotificationWatcher from '../../hooks/use-notification-watcher';
import ConnectionsSection from '../connections-section';
import IDCModal from '../idc-modal';
import JetpackManageBanner from '../jetpack-manage-banner';
import PlansSection from '../plans-section';
import ProductCardsSection from '../product-cards-section';
import WelcomeBanner from '../welcome-banner';
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
		return <ActionButton customClass={ styles.cta } { ...action } />;
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
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	useExperiment( 'explat_test_jetpack_implementation_aa_test' );
	useNotificationWatcher();
	const { redBubbleAlerts } = getMyJetpackWindowInitialState();
	const { jetpackManage = {}, adminUrl } = getMyJetpackWindowInitialState();

	const { isWelcomeBannerVisible } = useWelcomeBanner();
	const { currentNotice } = useContext( NoticeContext );
	const {
		message: noticeMessage,
		title: noticeTitle,
		options: noticeOptions,
	} = currentNotice || {};
	const { data: availabilityData, isLoading: isChatAvailabilityLoading } = useSimpleQuery( {
		name: QUERY_CHAT_AVAILABILITY_KEY,
		query: { path: REST_API_CHAT_AVAILABILITY_ENDPOINT },
	} );
	const { data: authData, isLoading: isJwtLoading } = useSimpleQuery( {
		name: QUERY_CHAT_AUTHENTICATION_KEY,
		query: { path: REST_API_CHAT_AUTHENTICATION_ENDPOINT },
	} );

	const isAvailable = availabilityData?.is_available;
	const jwt = authData?.user?.jwt;

	const shouldShowZendeskChatWidget =
		! isJwtLoading && ! isChatAvailabilityLoading && isAvailable && jwt;
	const isNewUser = getMyJetpackWindowInitialState( 'userIsNewToJetpack' ) === '1';

	const { recordEvent } = useAnalytics();
	const [ reloading, setReloading ] = useState( false );

	// useLayoutEffect gets called before useEffect.
	// We are using it here to ensure the `page_view` event gets triggered first.
	useLayoutEffect( () => {
		recordEvent( 'jetpack_myjetpack_page_view', {
			red_bubble_alerts: Object.keys( redBubbleAlerts ).join( ',' ),
		} );
	}, [ recordEvent, redBubbleAlerts ] );

	if ( window.location.hash.includes( '?reload=true' ) ) {
		// Clears the query string and reloads the page.
		window.history.replaceState( null, '', window.location.href.replace( '?reload=true', '' ) );
		window.location.reload();

		setReloading( true );
	}

	if ( reloading ) {
		return null;
	}

	return (
		<AdminPage siteAdminUrl={ adminUrl }>
			<hr className={ styles.separator } />

			<IDCModal />
			{ ! isNewUser && (
				<Container horizontalSpacing={ 0 }>
					<Col>
						<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
					</Col>
				</Container>
			) }
			<WelcomeBanner />
			{ noticeMessage && ! isWelcomeBannerVisible && (
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col>
						{
							<GlobalNotice
								message={ noticeMessage }
								title={ noticeTitle }
								options={ noticeOptions }
							/>
						}
					</Col>
				</Container>
			) }

			<ProductCardsSection />

			{ jetpackManage.isEnabled && (
				<Container horizontalSpacing={ 6 } horizontalGap={ noticeMessage ? 3 : 6 }>
					<Col>
						<JetpackManageBanner isAgencyAccount={ jetpackManage.isAgencyAccount } />
					</Col>
				</Container>
			) }

			<AdminSection>
				<Container horizontalSpacing={ 8 }>
					<Col sm={ 4 } md={ 4 } lg={ 6 }>
						<PlansSection />
					</Col>
					<Col sm={ 4 } md={ 4 } lg={ 6 }>
						<ConnectionsSection />
					</Col>
				</Container>
			</AdminSection>

			{ shouldShowZendeskChatWidget && <ZendeskChat jwt_token={ jwt } /> }
		</AdminPage>
	);
}

/*
 * External dependencies
 */
import {
	AdminSection,
	AdminSectionHero,
	AdminPage,
	Container,
	Col,
	Text,
	ZendeskChat,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import { Icon, Notice, Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import classnames from 'classnames';
import { useContext, useEffect, useState } from 'react';
/*
 * Internal dependencies
 */
import { NoticeContext } from '../../context/notices/noticeContext';
import {
	REST_API_CHAT_AUTHENTICATION_ENDPOINT,
	REST_API_CHAT_AVAILABILITY_ENDPOINT,
} from '../../data/constants';
import useProduct from '../../data/products/use-product';
import useSimpleQuery from '../../data/use-simple-query';
import useAnalytics from '../../hooks/use-analytics';
import useConnectionWatcher from '../../hooks/use-connection-watcher';
import useGlobalNotice from '../../hooks/use-notice';
import ConnectionsSection from '../connections-section';
import IDCModal from '../idc-modal';
import JetpackManageBanner from '../jetpack-manage-banner';
import PlansSection from '../plans-section';
import { PRODUCT_STATUSES } from '../product-card';
import ProductCardsSection from '../product-cards-section';
import StatsSection from '../stats-section';
import WelcomeBanner from '../welcome-banner';
import styles from './styles.module.scss';

const GlobalNotice = ( { message, options, clean = null } ) => {
	const [ isBiggerThanMedium ] = useBreakpointMatch( [ 'md' ], [ '>' ] );

	/*
	 * Map Notice statuses with Icons.
	 * `success`, `info`, `warning`, `error`
	 */
	const iconMap = {
		error: (
			<SVG
				className={ styles.nofill }
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					d="M11.7815 4.93772C11.8767 4.76626 12.1233 4.76626 12.2185 4.93772L20.519 19.8786C20.6116 20.0452 20.4911 20.25 20.3005 20.25H3.69951C3.50889 20.25 3.3884 20.0452 3.48098 19.8786L11.7815 4.93772Z"
					stroke="#D63638"
					strokeWidth="1.5"
				/>
				<Path d="M13 10H11V15H13V10Z" fill="#D63638" />
				<Path d="M13 16H11V18H13V16Z" fill="#D63638" />
			</SVG>
		),
		info,
	};

	return (
		<Notice
			isDismissible={ false }
			{ ...options }
			onRemove={ clean }
			className={
				styles.notice + ( isBiggerThanMedium ? ' ' + styles[ 'bigger-than-medium' ] : '' )
			}
		>
			<div className={ styles.message }>
				{ iconMap?.[ options.status ] && <Icon icon={ iconMap[ options.status ] } /> }
				{ message }
			</div>
		</Notice>
	);
};

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	useConnectionWatcher();
	// Check using the global state instead of Redux so it only has effect after refreshing the page
	const welcomeBannerHasBeenDismissed =
		window?.myJetpackInitialState?.welcomeBanner.hasBeenDismissed;
	const { showJetpackStatsCard = false } = window.myJetpackInitialState?.myJetpackFlags ?? {};
	const jetpackManage = window?.myJetpackInitialState?.jetpackManage;

	// This way of handling Global notices in redux is being deprecated.
	// This will be removed when all state that uses global notices has been migrated to tanstack useQuery
	const { message: messageDeprecated, options: optionsDeprecated, clean } = useGlobalNotice();

	const { currentNotice } = useContext( NoticeContext );
	const { message, options } = currentNotice || {};
	const { hasConnectionError } = useConnectionErrorNotice();
	const { data: availabilityData, isLoading: isChatAvailabilityLoading } = useSimpleQuery(
		'chat availability',
		{
			path: REST_API_CHAT_AVAILABILITY_ENDPOINT,
		}
	);
	const { detail: statsDetails } = useProduct( 'stats' );
	const { data: authData, isLoading: isJwtLoading } = useSimpleQuery( 'chat authentication', {
		path: REST_API_CHAT_AUTHENTICATION_ENDPOINT,
	} );

	const isAvailable = availabilityData?.is_available;
	const jwt = authData?.user?.jwt;

	const shouldShowZendeskChatWidget =
		! isJwtLoading && ! isChatAvailabilityLoading && isAvailable && jwt;
	const isNewUser = window?.myJetpackInitialState?.userIsNewToJetpack === '1';

	const { recordEvent } = useAnalytics();
	const [ reloading, setReloading ] = useState( false );

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_page_view' );
	}, [ recordEvent ] );

	if ( window.location.hash.includes( '?reload=true' ) ) {
		// Clears the query string and reloads the page.
		window.history.replaceState( null, '', window.location.href.replace( '?reload=true', '' ) );
		window.location.reload();

		setReloading( true );
	}

	if ( reloading ) {
		return null;
	}

	const globalNoticeMessage = message ?? messageDeprecated;
	const globalNoticeOptions = options?.status ? options : optionsDeprecated;

	return (
		<AdminPage siteAdminUrl={ window?.myJetpackInitialState?.adminUrl }>
			<IDCModal />
			<AdminSectionHero>
				{ ! isNewUser && (
					<Container horizontalSpacing={ 0 }>
						<Col>
							<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
						</Col>
					</Container>
				) }
				<WelcomeBanner />
				<Container horizontalSpacing={ 5 } horizontalGap={ message ? 3 : 6 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						<Text variant="headline-small">
							{ __( 'Discover all Jetpack Products', 'jetpack-my-jetpack' ) }
						</Text>
					</Col>
					{ hasConnectionError && ( welcomeBannerHasBeenDismissed || ! isNewUser ) && (
						<Col>
							<ConnectionError />
						</Col>
					) }
					{ globalNoticeMessage && ( welcomeBannerHasBeenDismissed || ! isNewUser ) && (
						<Col>
							<GlobalNotice
								message={ globalNoticeMessage }
								options={ globalNoticeOptions }
								clean={ clean }
							/>
						</Col>
					) }
					{ showJetpackStatsCard && (
						<Col
							className={ classnames( {
								[ styles.stats ]: statsDetails?.status !== PRODUCT_STATUSES.ERROR,
							} ) }
						>
							<StatsSection />
						</Col>
					) }
					<Col>
						<ProductCardsSection />
					</Col>
					{ jetpackManage.isEnabled && (
						<Col>
							<JetpackManageBanner isAgencyAccount={ jetpackManage.isAgencyAccount } />
						</Col>
					) }
				</Container>
			</AdminSectionHero>

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

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
import React, { useEffect, useState } from 'react';
/*
 * Internal dependencies
 */
import useAnalytics from '../../hooks/use-analytics';
import useChatAuthentication from '../../hooks/use-chat-authentication';
import useChatAvailability from '../../hooks/use-chat-availability';
import useConnectionWatcher from '../../hooks/use-connection-watcher';
import useGlobalNotice from '../../hooks/use-notice';
import { useProduct } from '../../hooks/use-product';
import ConnectionsSection from '../connections-section';
import IDCModal from '../idc-modal';
import PlansSection from '../plans-section';
import { PRODUCT_STATUSES } from '../product-card';
import ProductCardsSection from '../product-cards-section';
import StatsSection from '../stats-section';
import WelcomeBanner from '../welcome-banner';
import styles from './styles.module.scss';

const GlobalNotice = ( { message, options, clean } ) => {
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
	const isStatsModuleActive = window?.myJetpackInitialState?.isStatsModuleActive === '1';
	const { message, options, clean } = useGlobalNotice();
	const { hasConnectionError } = useConnectionErrorNotice();
	const { isAvailable, isFetchingChatAvailability } = useChatAvailability();
	const { detail: statsDetails } = useProduct( 'stats' );
	const { jwt, isFetchingChatAuthentication } = useChatAuthentication();
	const shouldShowZendeskChatWidget =
		! isFetchingChatAuthentication && ! isFetchingChatAvailability && isAvailable && jwt;

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

	return (
		<AdminPage siteAdminUrl={ window?.myJetpackInitialState?.adminUrl }>
			<IDCModal />
			<AdminSectionHero>
				<Container horizontalSpacing={ 0 }>
					<Col>
						<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
					</Col>
				</Container>
				<WelcomeBanner />
				<Container horizontalSpacing={ 5 } horizontalGap={ message ? 3 : 6 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						<Text variant="headline-small">
							{ __( 'Discover all Jetpack Products', 'jetpack-my-jetpack' ) }
						</Text>
					</Col>
					{ hasConnectionError && welcomeBannerHasBeenDismissed && (
						<Col>
							<ConnectionError />
						</Col>
					) }
					{ message && welcomeBannerHasBeenDismissed && (
						<Col>
							<GlobalNotice message={ message } options={ options } clean={ clean } />
						</Col>
					) }
					{ isStatsModuleActive && (
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

import { StrictMode, useEffect } from 'react';
import { createPortal } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import CriticalCssProvider from '$features/critical-css/critical-css-context/critical-css-context-provider';
import { NoticeProvider, useNotices } from '$features/notice/context';
import { SPEED_TEST_COMPLETE_EVENT } from '../../../../../../_inc/runtime-contract';
import { ModernNavigationProvider } from '$lib/navigation/navigation-context';
import { useModernRoute } from '$lib/modern/use-modern-route';
import { usePageView } from '$lib/modern/use-page-view';
import ModernSettings from './modern-settings';
import ModernSubpage from './modern-subpage';
import { useOnboardingRedirect } from './use-onboarding-redirect';

type ModernAppProps = {
	subpageSlot: HTMLElement;
};

/**
 * Settings renders in place and stays mounted; a sub-page is portalled out to
 * the chassis mount that sits outside the dashboard content.
 *
 * @param props             - Component props.
 * @param props.subpageSlot - Chassis mount for the active sub-page.
 */
const ModernRoutes = ( { subpageSlot }: ModernAppProps ) => {
	const route = useModernRoute();
	const redirecting = useOnboardingRedirect( route );
	const { setNotice } = useNotices();

	useEffect( () => {
		const onSpeedTestComplete = () =>
			setNotice( {
				id: 'speed-test-complete',
				type: 'success',
				message: __( 'Speed test complete.', 'jetpack-boost' ),
			} );
		window.addEventListener( SPEED_TEST_COMPLETE_EVENT, onSpeedTestComplete );
		return () => window.removeEventListener( SPEED_TEST_COMPLETE_EVENT, onSpeedTestComplete );
	}, [ setNotice ] );

	usePageView( route, ! redirecting );

	return (
		<>
			<ModernSettings hidden={ redirecting } />
			{ route.subpage &&
				! redirecting &&
				createPortal( <ModernSubpage subpage={ route.subpage } />, subpageSlot ) }
		</>
	);
};

/**
 * The data, notice and critical CSS providers sit above both screens, so moving
 * between Settings and a sub-page never drops their state.
 *
 * @param props             - Component props.
 * @param props.subpageSlot - Chassis mount for the active sub-page.
 */
const ModernApp = ( { subpageSlot }: ModernAppProps ) => (
	<StrictMode>
		<DataSyncProvider>
			<ModernNavigationProvider>
				<NoticeProvider>
					<CriticalCssProvider>
						<ModernRoutes subpageSlot={ subpageSlot } />
					</CriticalCssProvider>
				</NoticeProvider>
			</ModernNavigationProvider>
		</DataSyncProvider>
	</StrictMode>
);

export default ModernApp;

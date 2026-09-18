import { StrictMode } from 'react';
import { createPortal } from '@wordpress/element';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import CriticalCssProvider from '$features/critical-css/critical-css-context/critical-css-context-provider';
import { NoticeProvider } from '$features/notice/context';
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
 * the chassis mount that sits outside the tab shell.
 *
 * @param props             - Component props.
 * @param props.subpageSlot - Chassis mount for the active sub-page.
 */
const ModernRoutes = ( { subpageSlot }: ModernAppProps ) => {
	const route = useModernRoute();
	const redirecting = useOnboardingRedirect( route );

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

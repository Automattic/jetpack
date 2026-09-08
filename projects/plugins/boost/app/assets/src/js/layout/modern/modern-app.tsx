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
import type { ModernSlots } from '$lib/modern/mode';

type ModernAppProps = {
	slots: ModernSlots;
};

/**
 * The routed half of the app: one Settings tree that stays mounted, and at most
 * one sub-page, each portalled into the chassis slot that owns it.
 *
 * @param props       - Component props.
 * @param props.slots - Chassis slots to portal into.
 */
const ModernRoutes = ( { slots }: ModernAppProps ) => {
	const route = useModernRoute();
	const redirecting = useOnboardingRedirect( route );

	usePageView( route, ! redirecting );

	return (
		<>
			{ createPortal( <ModernSettings hidden={ redirecting } />, slots.settings ) }
			{ route.subpage &&
				! redirecting &&
				createPortal( <ModernSubpage subpage={ route.subpage } />, slots.subpage ) }
		</>
	);
};

/**
 * The modern app: one persistent root for the page lifetime, holding the data,
 * notice and critical CSS providers above both slots so moving between Settings
 * and a sub-page never drops their state.
 *
 * @param props       - Component props.
 * @param props.slots - Chassis slots to portal into.
 */
const ModernApp = ( { slots }: ModernAppProps ) => (
	<StrictMode>
		<DataSyncProvider>
			<ModernNavigationProvider>
				<NoticeProvider>
					<CriticalCssProvider>
						<ModernRoutes slots={ slots } />
					</CriticalCssProvider>
				</NoticeProvider>
			</ModernNavigationProvider>
		</DataSyncProvider>
	</StrictMode>
);

export default ModernApp;

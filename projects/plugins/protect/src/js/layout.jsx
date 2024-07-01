import { ThemeProvider } from '@automattic/jetpack-components';
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Modal from './components/modal';
import { OnboardingRenderedContextProvider } from './hooks/use-onboarding';

/**
 * Component to scroll window to top on route change.
 *
 * @returns {null} Null.
 */
function ScrollToTop() {
	const location = useLocation();
	useEffect( () => window.scrollTo( 0, 0 ), [ location ] );

	return null;
}

/**
 * Root Layout
 *
 * @returns {React.Element} Layout.
 */
export default function Layout() {
	return (
		<ThemeProvider>
			<OnboardingRenderedContextProvider value={ { renderedSteps: [] } }>
				<ScrollToTop />
				<Outlet />
				<Modal />
			</OnboardingRenderedContextProvider>
		</ThemeProvider>
	);
}

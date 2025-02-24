import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as WPElement from '@wordpress/element';
import App from './app';
import { ModalProvider } from './hooks/use-modal';
import { NoticeProvider } from './hooks/use-notices';
import { OnboardingRenderedContextProvider } from './hooks/use-onboarding';
import { CheckoutProvider } from './hooks/use-plan';

const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			staleTime: Infinity,
		},
	},
} );

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-protect-root' );

	if ( null === container ) {
		return;
	}

	WPElement.createRoot( container ).render(
		<QueryClientProvider client={ queryClient }>
			<ThemeProvider>
				<NoticeProvider>
					<ModalProvider>
						<CheckoutProvider>
							<OnboardingRenderedContextProvider>
								<App />
							</OnboardingRenderedContextProvider>
						</CheckoutProvider>
					</ModalProvider>
				</NoticeProvider>
			</ThemeProvider>
			<ReactQueryDevtools initialIsOpen={ false } />
		</QueryClientProvider>
	);
}

render();

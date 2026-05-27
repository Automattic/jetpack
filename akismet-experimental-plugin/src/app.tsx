import { QueryClientProvider } from '@tanstack/react-query';
import { Page } from '@wordpress/admin-ui';
import { SlotFillProvider } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { JetpackFooter } from '@/components/jetpack-footer';
import { isJetpackActive } from '@/lib/is-jetpack-active';
import { createQueryClient } from '@/lib/query-client';
import '@/styles/app.scss';

const queryClient = createQueryClient();

/**
 * Root component for the Akismet experimental admin UI.
 *
 * @return The wrapped `<Page>` shell with optional `<JetpackFooter>`.
 *         Feature children are added by later plans.
 */
export function App(): JSX.Element {
	return (
		<SlotFillProvider>
			<QueryClientProvider client={ queryClient }>
				<Page className="akismet-experimental" title={ __( 'Akismet Anti-Spam', 'akismet' ) }>
					{ /* Feature children added in subsequent plans. */ }
				</Page>
				{ isJetpackActive() && <JetpackFooter a8cLogoHref="https://automattic.com" /> }
			</QueryClientProvider>
		</SlotFillProvider>
	);
}

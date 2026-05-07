import analytics from '@automattic/jetpack-analytics';
import { QueryClientProvider } from '@tanstack/react-query';
import { Page } from '@wordpress/admin-ui';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import SubscribersBody from '../../_inc/subscribers/components/subscribers-body';
import { queryClient } from '../../_inc/subscribers/lib/query-client';
import { getNewsletterScriptData } from '../../src/settings/script-data';
import './route.scss';

const Stage = () => {
	// Initialize analytics once for the entire page so future tab/section
	// events fire regardless of which tab a visitor lands on. Mirrors the
	// initialization that lived in the legacy `NewsletterSettingsApp`.
	useEffect( () => {
		const tracksUserData = getNewsletterScriptData()?.tracksUserData;
		if ( tracksUserData && typeof tracksUserData === 'object' ) {
			analytics.initialize( tracksUserData.userid, tracksUserData.username );
		}
	}, [] );

	return (
		<QueryClientProvider client={ queryClient }>
			<SubscribersBody>
				{ ( { body, actions } ) => (
					<Page
						/* "Newsletter" is a product name, do not translate. */
						title="Newsletter"
						subTitle={ __( 'Manage everyone subscribed to your site.', 'jetpack-newsletter' ) }
						actions={ actions }
						hasPadding={ false }
					>
						{ body }
					</Page>
				) }
			</SubscribersBody>
		</QueryClientProvider>
	);
};

export { Stage as stage };

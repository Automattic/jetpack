/**
 * Internal dependencies
 */
import { buildAkismetCard } from '../helpers/akismet.tsx';
import { buildGoogleDriveCard } from '../helpers/google-drive.tsx';
import { buildHostingerReachCard } from '../helpers/hostinger-reach.tsx';
import { buildJetpackCrmCard } from '../helpers/jetpack-crm.tsx';
import { buildMailPoetCard } from '../helpers/mailpoet.tsx';
import { buildSalesforceCard } from '../helpers/salesforce.tsx';
import type { CardItem, IntegrationsListProps } from '../helpers/types.ts';

// Maps raw integrations into card items for rendering.
const useIntegrationCardsData = ( {
	integrations = [],
	refreshIntegrations,
	context,
	handlers,
	attributes,
	setAttributes,
}: IntegrationsListProps ): CardItem[] => {
	return integrations.map( integration => {
		const base: CardItem = {
			id: integration.id,
			title: integration.title,
			description: integration.subtitle,
			cardData: {
				...integration,
				isLoading: typeof integration.isInstalled === 'undefined',
				refreshStatus: refreshIntegrations,
			},
		};

		switch ( integration.id ) {
			case 'akismet':
				return buildAkismetCard( {
					integration,
					refreshIntegrations,
					context,
					handlers,
				} );
			case 'google-drive':
				return buildGoogleDriveCard( {
					integration,
					refreshIntegrations,
					context,
					handlers,
				} );
			case 'zero-bs-crm':
				return buildJetpackCrmCard( {
					integration,
					refreshIntegrations,
					context,
					attributes,
					setAttributes,
				} );
			case 'mailpoet':
				return buildMailPoetCard( {
					integration,
					refreshIntegrations,
					context,
					attributes,
					setAttributes,
				} );
			case 'hostinger-reach':
				return buildHostingerReachCard( {
					integration,
					refreshIntegrations,
					context,
					attributes,
					setAttributes,
				} );
			case 'salesforce':
				return buildSalesforceCard( {
					integration,
					refreshIntegrations,
					context,
					attributes,
					setAttributes,
				} );
			default:
				return base;
		}
	} );
};

export default useIntegrationCardsData;

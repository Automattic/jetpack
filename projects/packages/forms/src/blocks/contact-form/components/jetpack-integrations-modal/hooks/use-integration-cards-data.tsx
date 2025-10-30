/**
 * Internal dependencies
 */
import { buildAkismetCard } from '../helpers/akismet';
import { buildGoogleDriveCard } from '../helpers/google-drive';
import { buildHostingerReachCard } from '../helpers/hostinger-reach';
import { buildJetpackCrmCard } from '../helpers/jetpack-crm';
import { buildMailPoetCard } from '../helpers/mailpoet';
import { buildSalesforceCard } from '../helpers/salesforce';
import type { CardItem, IntegrationsListProps } from '../helpers/types';

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

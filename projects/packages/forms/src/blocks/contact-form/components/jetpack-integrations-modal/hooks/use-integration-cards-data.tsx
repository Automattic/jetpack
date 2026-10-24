/**
 * Internal dependencies
 */
import { getFormsIntegration } from '../../../../../integrations/registry.ts';
import { registerBuiltInIntegrations } from '../helpers/register-built-ins.ts';
import type { CardItem, IntegrationsListProps } from '../helpers/types.ts';

// Maps raw integrations into card items for rendering.
//
// Which card an integration renders comes from the client-side registry, so an integration
// added by a plugin is looked up exactly the way a bundled one is. An integration that
// registers no card — because it has no settings, or because its script has not loaded —
// falls back to the title and description the server supplied.
const useIntegrationCardsData = ( {
	integrations = [],
	refreshIntegrations,
	context,
	handlers,
	attributes,
	setAttributes,
	components,
}: IntegrationsListProps ): CardItem[] => {
	registerBuiltInIntegrations();

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

		const buildCard = getFormsIntegration( integration.id )?.buildCard;

		if ( ! buildCard ) {
			return base;
		}

		return buildCard( {
			integration,
			refreshIntegrations,
			context,
			handlers,
			attributes,
			setAttributes,
			components,
		} );
	} );
};

export default useIntegrationCardsData;

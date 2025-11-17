/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useState, useMemo, useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useIntegrationCardsData from './hooks/use-integration-cards-data.tsx';
import IntegrationCard from './integration-card/index.tsx';
import type { IntegrationsListProps } from './helpers/types.ts';

interface ExpandedCardsState {
	[ id: string ]: boolean;
}

const IntegrationsList = ( {
	integrations = [],
	refreshIntegrations,
	context,
	handlers,
	attributes,
	setAttributes,
}: IntegrationsListProps ) => {
	const items = useIntegrationCardsData( {
		integrations,
		refreshIntegrations,
		context,
		handlers,
		attributes,
		setAttributes,
	} );

	const initialCardsExpandedState = useMemo( () => {
		const state: ExpandedCardsState = {};
		integrations.forEach( integration => {
			state[ integration.id ] = false;
		} );
		return state;
	}, [ integrations ] );

	const [ expandedCards, setExpandedCards ] =
		useState< ExpandedCardsState >( initialCardsExpandedState );

	const toggleCard = useCallback(
		( id: string ) => {
			setExpandedCards( prev => {
				const isExpanding = ! prev[ id ];
				if ( isExpanding ) {
					jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_integrations_card_expand', {
						card: id,
						origin: context,
					} );
				}
				return { ...prev, [ id ]: isExpanding };
			} );
		},
		[ context ]
	);

	return (
		<>
			{ items.map( item => (
				<IntegrationCard
					key={ item.id }
					title={ item.title }
					description={ item.description }
					icon={ item.icon }
					isExpanded={ !! expandedCards[ item.id ] }
					onToggle={ () => toggleCard( item.id ) }
					cardData={ item.cardData }
					toggleTooltip={ item.toggleTooltip }
				>
					{ item.body }
				</IntegrationCard>
			) ) }
		</>
	);
};

export default IntegrationsList;

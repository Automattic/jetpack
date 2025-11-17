/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useState, useMemo, useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import IntegrationCard from './integration-card/index.tsx';
/**
 * Types
 */
import type { IntegrationCard as IntegrationCardType } from '../../../../types/index.ts';

type IntegrationsListProps = {
	integrationCards: IntegrationCardType[];
	context: 'block-editor' | 'dashboard';
};
interface ExpandedCardsState {
	[ id: string ]: boolean;
}

const IntegrationsList = ( { integrationCards, context }: IntegrationsListProps ) => {
	const cards: IntegrationCardType[] = integrationCards;
	const initialCardsExpandedState = useMemo( () => {
		const state: ExpandedCardsState = {};
		cards.forEach( integrationCard => {
			state[ integrationCard.id ] = false;
		} );
		return state;
	}, [ cards ] );

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
			{ cards.map( integrationCard => (
				<IntegrationCard
					key={ integrationCard.id }
					integrationCard={ integrationCard }
					isExpanded={ !! expandedCards[ integrationCard.id ] }
					onToggle={ () => toggleCard( integrationCard.id ) }
				>
					{ integrationCard.body }
				</IntegrationCard>
			) ) }
		</>
	);
};

export default IntegrationsList;

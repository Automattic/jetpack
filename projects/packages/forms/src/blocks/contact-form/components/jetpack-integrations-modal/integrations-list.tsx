/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useState, useMemo, useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useIntegrationCardsData from './hooks/use-integration-cards-data';
import IntegrationCard from './integration-card';
import type { IntegrationsListProps } from './helpers/types';

interface ExpandedCardsState {
	[ id: string ]: boolean;
}

const IntegrationsList = ( {
	integrations = [],
	refreshIntegrations,
	handlers,
	attributes,
	setAttributes,
}: IntegrationsListProps ) => {
	const items = useIntegrationCardsData( {
		integrations,
		refreshIntegrations,
		context: 'block-editor',
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

	const toggleCard = useCallback( ( id: string ) => {
		setExpandedCards( prev => {
			const isExpanding = ! prev[ id ];
			if ( isExpanding ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_integrations_card_expand', {
					card: id,
					origin: 'block-editor',
				} );
			}
			return { ...prev, [ id ]: isExpanding };
		} );
	}, [] );

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

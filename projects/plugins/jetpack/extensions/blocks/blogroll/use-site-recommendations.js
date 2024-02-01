import { useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { createBlockFromRecommendation } from './utils';

export const useSiteRecommendationSync = ( { clientId } ) => {
	const [ hasPulled, setHasPulled ] = useState( false );
	const { insertBlocks } = useDispatch( 'core/block-editor' );

	const [ siteRecommendations, setSiteRecommendations ] = useEntityProp(
		'root',
		'site',
		'Blogroll Recommendations'
	);

	const innerBlockAttributes = useSelect(
		select =>
			select( 'core/block-editor' )
				.getBlock( clientId )
				.innerBlocks.filter( ( { name } ) => name === 'jetpack/blogroll-item' )
				.map( ( { attributes } ) => attributes ),
		[ clientId ]
	);

	// Pull from the backend
	useEffect( () => {
		if ( ! hasPulled && !! siteRecommendations ) {
			const missingBlocks = siteRecommendations.filter( recommendation => {
				return ! innerBlockAttributes.some( attribute => attribute.id === recommendation.id );
			} );

			if ( missingBlocks.length ) {
				const blocksToAdd = missingBlocks.map( createBlockFromRecommendation );
				insertBlocks( blocksToAdd, undefined, clientId );
			}
			setHasPulled( true );
		}
	}, [ clientId, siteRecommendations, innerBlockAttributes, hasPulled, insertBlocks ] );

	// Push to the backend
	useEffect( () => {
		if ( siteRecommendations !== undefined ) {
			setSiteRecommendations( innerBlockAttributes );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ innerBlockAttributes ] );
};

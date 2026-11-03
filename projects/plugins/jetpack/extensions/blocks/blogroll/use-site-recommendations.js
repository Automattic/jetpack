import { useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { isEqual } from 'lodash';
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

	// Push to the backend, but not on load: defaults such as the placeholder icon URL can differ
	// from what was saved, and pushing them would mark the site as edited on every visit.
	const loadedAttributes = useRef( innerBlockAttributes );
	useEffect( () => {
		if ( loadedAttributes.current && isEqual( loadedAttributes.current, innerBlockAttributes ) ) {
			return;
		}
		loadedAttributes.current = null;

		if ( siteRecommendations !== undefined ) {
			setSiteRecommendations( innerBlockAttributes );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ innerBlockAttributes ] );
};

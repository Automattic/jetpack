import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState, useMemo } from '@wordpress/element';
import { debounce } from '../../shared/debounce';
import { createBlockFromRecommendation } from './utils';

export function useBlogrollItemAttributes( clientId ) {
	const block = useSelect(
		select => {
			return select( 'core/block-editor' ).getBlock( clientId );
		},
		[ clientId ]
	);

	return useMemo( () => {
		return block?.innerBlocks
			.filter( ( { name } ) => name === 'jetpack/blogroll-item' )
			.map( ( { attributes } ) => {
				return attributes;
			} );
	}, [ block?.innerBlocks ] );
}

export const useSiteRecommendationSync = ( { clientId, siteRecommendations } ) => {
	const [ hasSynced, setHasSynced ] = useState( false );

	const { insertBlocks } = useDispatch( 'core/block-editor' );
	const blogrollItemAttributes = useBlogrollItemAttributes( clientId );

	useEffect( () => {
		if ( ! hasSynced && !! siteRecommendations ) {
			const attributes = blogrollItemAttributes;

			const missingBlocks = siteRecommendations.filter( recommendation => {
				return ! attributes.some( attribute => attribute.id === recommendation.id );
			} );

			if ( missingBlocks.length ) {
				const blocksToAdd = missingBlocks.map( createBlockFromRecommendation );
				insertBlocks( blocksToAdd, undefined, clientId );
			}
			setHasSynced( true );
		}
	}, [ clientId, siteRecommendations, blogrollItemAttributes, hasSynced, insertBlocks ] );
};

const debounceSave = debounce(
	( { innerBlockAttributes, editEntityRecord, siteRecommendations, setSiteRecommendations } ) => {
		if ( siteRecommendations !== undefined ) {
			setSiteRecommendations( innerBlockAttributes );
			editEntityRecord( 'root', 'site', undefined, {
				recommendations: innerBlockAttributes,
			} );
		}
	},
	1500
);

export const useSaveSiteRecommendations = ( { clientId } ) => {
	const [ siteRecommendations, setSiteRecommendations ] = useEntityProp(
		'root',
		'site',
		'recommendations'
	);

	const { editEntityRecord } = useDispatch( coreStore );
	const innerBlockAttributes = useBlogrollItemAttributes( clientId );

	useEffect( () => {
		debounceSave( {
			innerBlockAttributes,
			editEntityRecord,
			siteRecommendations,
			setSiteRecommendations,
		} );
	}, [ siteRecommendations, setSiteRecommendations, innerBlockAttributes, editEntityRecord ] );

	return { siteRecommendations };
};

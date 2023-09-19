import { usePrevious } from '@wordpress/compose';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { createBlockFromRecommendation } from './utils';

function usePostHasBeenJustSaved() {
	const isSaving = useSelect( select => {
		const { isSavingPost, isSavingNonPostEntityChanges } = select( 'core/editor' );
		return isSavingPost() || isSavingNonPostEntityChanges();
	}, [] );
	const wasSaving = usePrevious( isSaving );

	return !! ( wasSaving && ! isSaving );
}

function useSaveSetting( { setIsSavingSetting, setSiteRecommendations, saveEditedEntityRecord } ) {
	return useCallback(
		recommendations => {
			setIsSavingSetting( true );
			setSiteRecommendations( recommendations );
			saveEditedEntityRecord( 'root', 'site', undefined, {
				site_recommendations: recommendations,
			} ).finally( () => {
				setIsSavingSetting( false );
			} );
		},
		[ setIsSavingSetting, setSiteRecommendations, saveEditedEntityRecord ]
	);
}

function useBlogrollItemAttributes( clientId ) {
	const block = useSelect(
		select => {
			return select( 'core/block-editor' ).getBlock( clientId );
		},
		[ clientId ]
	);

	return useCallback( () => {
		if ( ! block ) {
			return null;
		}

		return block.innerBlocks
			.filter( ( { name } ) => name === 'jetpack/blogroll-item' )
			.map( ( { attributes } ) => {
				return attributes;
			} );
	}, [ block ] );
}

export const useSiteRecommendationSync = ( { clientId, siteRecommendations } ) => {
	const [ hasSynced, setHasSynced ] = useState( false );

	const { insertBlocks } = useDispatch( 'core/block-editor' );
	const extractBlogrollItemAttributes = useBlogrollItemAttributes( clientId );

	useEffect( () => {
		if ( ! hasSynced && !! siteRecommendations ) {
			const attributes = extractBlogrollItemAttributes();

			const missingBlocks = siteRecommendations.filter( recommendation => {
				return ! attributes.some( attribute => attribute.id === recommendation.id );
			} );

			if ( missingBlocks.length ) {
				const blocksToAdd = missingBlocks.map( createBlockFromRecommendation );
				insertBlocks( blocksToAdd, undefined, clientId );
			}
			setHasSynced( true );
		}
	}, [ clientId, siteRecommendations, extractBlogrollItemAttributes, hasSynced, insertBlocks ] );
};

export const useSiteRecommendations = ( { clientId } ) => {
	const [ siteRecommendations, setSiteRecommendations ] = useEntityProp(
		'root',
		'site',
		'site_recommendations'
	);
	const [ isSavingSetting, setIsSavingSetting ] = useState( false );
	const { saveEditedEntityRecord } = useDispatch( coreStore );

	const postHasBeenJustSaved = usePostHasBeenJustSaved();
	const extractBlogrollItemAttributes = useBlogrollItemAttributes( clientId );

	const saveSiteRecommendations = useSaveSetting( {
		setIsSavingSetting,
		setSiteRecommendations,
		saveEditedEntityRecord,
	} );

	useEffect( () => {
		if ( postHasBeenJustSaved && ! isSavingSetting ) {
			saveSiteRecommendations( extractBlogrollItemAttributes() );
		}
	}, [
		postHasBeenJustSaved,
		isSavingSetting,
		saveSiteRecommendations,
		extractBlogrollItemAttributes,
	] );

	return {
		siteRecommendations,
	};
};

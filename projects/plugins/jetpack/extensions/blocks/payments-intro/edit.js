/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { createBlock, getBlockType, registerBlockVariation } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	__experimentalBlockVariationPicker as BlockVariationPicker,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import defaultVariations from './variations';

export default function JetpackPaymentsIntroEdit( { name, clientId } ) {
	const { blockType, hasInnerBlocks } = useSelect( select => {
		const { getBlocks } = select( blockEditorStore );

		return {
			blockType: getBlockType( name ),
			hasInnerBlocks: getBlocks( clientId )?.length > 0,
		};
	} );

	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );

	const setVariation = variation => {
		replaceBlock( clientId, createBlock( variation.name ) );
		selectBlock( clientId );
	};

	const usableVariations = defaultVariations.filter( variation => getBlockType( variation.name ) );

	useEffect( () => {
		// Populate default variation on older versions of WP or GB that don't support variations.
		if ( ! hasInnerBlocks && ! registerBlockVariation ) {
			setVariation( usableVariations[ 0 ] );
		}
	} );

	const renderVariationPicker = () => {
		return (
			<BlockVariationPicker
				icon={ get( blockType, [ 'icon', 'src' ] ) }
				label={ get( blockType, [ 'title' ] ) }
				instructions={ __( "Please select which kind of payment you'd like to add.", 'jetpack' ) }
				variations={ usableVariations }
				onSelect={ ( nextVariation = usableVariations[ 0 ] ) => {
					setVariation( nextVariation );
				} }
			/>
		);
	};

	if ( ! hasInnerBlocks && registerBlockVariation ) {
		return renderVariationPicker();
	}

	return <InnerBlocks />;
}

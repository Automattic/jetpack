/**
 * External dependencies
 */
import { get } from 'lodash';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { createBlock, registerBlockVariation, store as blocksStore } from '@wordpress/blocks';
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
	const { blockType, defaultVariation, variations, hasInnerBlocks } = useSelect( select => {
		const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( blocksStore );
		const { getBlocks } = select( blockEditorStore );

		return {
			blockType: getBlockType( name ),
			defaultVariation: getDefaultBlockVariation( name, 'block' ),
			variations: getBlockVariations( name, 'block' ),
			hasInnerBlocks: getBlocks( clientId )?.length > 0,
		};
	} );

	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );

	const setVariation = variation => {
		replaceBlock( clientId, createBlock( variation.name.replace( 'payments-intro', 'jetpack' ) ) );
		selectBlock( clientId );
	};

	useEffect( () => {
		// Populate default variation on older versions of WP or GB that don't support variations.
		if ( ! hasInnerBlocks && ! registerBlockVariation ) {
			setVariation( defaultVariations[ 0 ] );
		}
	} );

	const renderVariationPicker = () => {
		return (
			<BlockVariationPicker
				icon={ get( blockType, [ 'icon', 'src' ] ) }
				label={ get( blockType, [ 'title' ] ) }
				instructions={ __( "Please select which kind of payment you'd like to add.", 'jetpack' ) }
				variations={ variations }
				onSelect={ ( nextVariation = defaultVariation ) => {
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

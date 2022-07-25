import { InnerBlocks, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, getBlockType, registerBlockVariation } from '@wordpress/blocks';
import { Placeholder } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import PaymentsIntroBlockPicker from './block-picker';
import defaultVariations from './variations';

export default function JetpackPaymentsIntroEdit( { name, clientId, className } ) {
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
			<Placeholder
				icon={ get( blockType, [ 'icon', 'src' ] ) }
				label={ get( blockType, [ 'title' ] ) }
				instructions={ __( "Please select which kind of payment you'd like to add.", 'jetpack' ) }
				className={ className }
			>
				<PaymentsIntroBlockPicker
					label={ __( 'Payment Block list', 'jetpack' ) }
					variations={ usableVariations }
					onSelect={ ( nextVariation = usableVariations[ 0 ] ) => {
						setVariation( nextVariation );
					} }
				/>
			</Placeholder>
		);
	};

	if ( ! hasInnerBlocks && registerBlockVariation ) {
		return renderVariationPicker();
	}

	return <InnerBlocks />;
}

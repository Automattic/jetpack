import { InnerBlocks, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, getBlockType, registerBlockVariation } from '@wordpress/blocks';
import { Button, Placeholder } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import defaultVariations from './variations';

const JetpackBlockVariationPicker = function ( { variations, onSelect } ) {
	return (
		<ul
			aria-label={ __( 'Payment Block list', 'jetpack' ) }
			className="wp-payments-intro-variation-picker"
		>
			{ variations.map( variation => (
				<li key={ variation.name }>
					<Button
						variant="secondary"
						icon={ variation.icon }
						iconSize={ 48 }
						onClick={ () => onSelect( variation ) }
						className="wp-payments-intro-variation-picker__variation"
						label={ variation.description || variation.title }
					/>
					<span className="wp-payments-intro-variation-picker__variation-label" role="presentation">
						{ variation.title }
					</span>
				</li>
			) ) }
		</ul>
	);
};

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
			<Placeholder
				icon={ get( blockType, [ 'icon', 'src' ] ) }
				label={ get( blockType, [ 'title' ] ) }
				instructions={ __( "Please select which kind of payment you'd like to add.", 'jetpack' ) }
				//className="block-editor-block-variation-picker"
				className="wp-payments-intro-wrapper"
			>
				<JetpackBlockVariationPicker
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

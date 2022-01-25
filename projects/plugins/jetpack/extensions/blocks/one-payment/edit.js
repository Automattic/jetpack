/**
 * External dependencies
 */
import { get, map } from 'lodash';
import classnames from 'classnames';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';
import { createBlock, registerBlockVariation } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import {
	InnerBlocks,
	__experimentalBlockVariationPicker as BlockVariationPicker,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import defaultVariations from './variations';

export function JetpackOnePaymentEdit( {
	setAttributes,
	hasInnerBlocks,
	replaceInnerBlocks,
	selectBlock,
	clientId,
	className,
	blockType,
	variations,
	defaultVariation,
} ) {
	const formClassnames = classnames( className, 'jetpackone-payment' );

	const createBlocksFromInnerBlocksTemplate = innerBlocksTemplate => {
		const blocks = map( innerBlocksTemplate, ( [ name, attr, innerBlocks = [] ] ) =>
			createBlock( name, attr, createBlocksFromInnerBlocksTemplate( innerBlocks ) )
		);

		return blocks;
	};

	const setVariation = variation => {
		if ( variation.attributes ) {
			setAttributes( variation.attributes );
		}

		if ( variation.innerBlocks ) {
			replaceInnerBlocks( clientId, createBlocksFromInnerBlocksTemplate( variation.innerBlocks ) );
		}

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
			<div className={ formClassnames }>
				<BlockVariationPicker
					icon={ get( blockType, [ 'icon', 'src' ] ) }
					label={ get( blockType, [ 'title' ] ) }
					instructions={ __( "Please select which kind of payment you'd like to add.", 'jetpack' ) }
					variations={ variations }
					onSelect={ ( nextVariation = defaultVariation ) => {
						setVariation( nextVariation );
					} }
				/>
			</div>
		);
	};

	if ( ! hasInnerBlocks && registerBlockVariation ) {
		return renderVariationPicker();
	}

	return <InnerBlocks />;
}

export default compose( [
	withSelect( ( select, props ) => {
		const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( 'core/blocks' );
		const { getBlocks } = select( 'core/block-editor' );
		const innerBlocks = getBlocks( props.clientId );

		return {
			blockType: getBlockType && getBlockType( props.name ),
			defaultVariation: getDefaultBlockVariation && getDefaultBlockVariation( props.name, 'block' ),
			variations: getBlockVariations && getBlockVariations( props.name, 'block' ),

			innerBlocks,
			hasInnerBlocks: innerBlocks.length > 0,
		};
	} ),
	withDispatch( dispatch => {
		const { replaceInnerBlocks, selectBlock } = dispatch( 'core/block-editor' );
		return { replaceInnerBlocks, selectBlock };
	} ),
	withInstanceId,
] )( JetpackOnePaymentEdit );

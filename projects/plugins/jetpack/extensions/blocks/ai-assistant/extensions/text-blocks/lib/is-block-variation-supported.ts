/*
 * External dependencies
 */
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { JETPACK_FORM_CHILDREN_BLOCKS } from '../constants';
/**
 * Types
 */
import type { Block } from '@automattic/jetpack-ai-client';

type BlockEditorSelect = {
	getBlockParentsByBlockName: ( clientId: string, blockName: string ) => string[];
	getBlockAttributes: ( clientId: string ) => Block[ 'attributes' ];
};

const { getBlockParentsByBlockName, getBlockAttributes } = select(
	'core/block-editor'
) as unknown as BlockEditorSelect;

/**
 * Check if the block variation is supported.
 * @param {Block} props - The block.
 * @return {boolean} Whether the block variation is supported.
 */
export function isBlockVariationSupported( props: Block ): boolean {
	const { name, attributes, clientId } = props;

	if ( ! name || ! clientId || ! attributes ) {
		return true;
	}

	// Only Jetpack Forms have variations
	if ( ! [ 'jetpack/contact-form', ...JETPACK_FORM_CHILDREN_BLOCKS ].includes( name ) ) {
		return true;
	}

	if ( name === 'jetpack/contact-form' ) {
		return true;
	}

	// If the block is a Jetpack Form child, check its parent Form block.
	const parentForm = getBlockParentsByBlockName( clientId, 'jetpack/contact-form' )?.[ 0 ];
	const parentFormAttributes = getBlockAttributes( parentForm );

	return isBlockVariationSupported( {
		name: 'jetpack/contact-form',
		clientId: parentForm,
		attributes: parentFormAttributes,
	} );
}

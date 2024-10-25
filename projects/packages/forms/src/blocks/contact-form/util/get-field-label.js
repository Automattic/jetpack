import { getBlockType } from '@wordpress/blocks';

/**
 * Return the label of a block field from its attributes. Default to the block title.
 *
 * @param {object} attributes - Block attributes
 * @param {string} name       - Block name
 * @return {string} Field label
 */
export default function getFieldLabel( attributes, name ) {
	return attributes.label || getBlockType( name ).title;
}

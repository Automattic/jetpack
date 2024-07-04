/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { applyFormat, toHTMLString } from '@wordpress/rich-text';
/**
 * Types
 */
import type { RichTextFormat } from '@wordpress/rich-text/build-types/types';

const applyHighlightFormat = ( { content, type, indexes, attributes = {} } ) => {
	const newContent = indexes.reduce( ( acc, { startIndex, endIndex } ) => {
		const format = {
			type,
			attributes,
		} as RichTextFormat;

		return applyFormat( acc, format, startIndex, endIndex );
	}, content );
	return toHTMLString( { value: newContent } );
};

export default function highlight( { block, type, indexes, attributes } ) {
	const updateBlockAttributes = dispatch( 'core/block-editor' ).updateBlockAttributes;
	const { clientId, content } = block;
	const newContent = applyHighlightFormat( { indexes, content, type, attributes } );
	updateBlockAttributes( clientId, { content: newContent } );
}

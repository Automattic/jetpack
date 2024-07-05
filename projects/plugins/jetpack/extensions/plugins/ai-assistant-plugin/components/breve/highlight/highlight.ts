/**
 * External dependencies
 */
import { applyFormat } from '@wordpress/rich-text';
/**
 * Types
 */
import type { RichTextFormat } from '@wordpress/rich-text/build-types/types';

const applyHighlightFormat = ( { content, type, indexes, attributes = {} } ) => {
	let newContent = content;

	if ( indexes.length > 0 ) {
		newContent = indexes.reduce( ( acc, { startIndex, endIndex } ) => {
			const format = {
				type,
				attributes,
			} as RichTextFormat;

			return applyFormat( acc, format, startIndex, endIndex );
		}, content );
	}

	return newContent;
};

export default function highlight( { content, type, indexes, attributes } ) {
	return applyHighlightFormat( { indexes, content, type, attributes } );
}

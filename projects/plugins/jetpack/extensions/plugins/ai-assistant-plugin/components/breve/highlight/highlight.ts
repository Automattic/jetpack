/**
 * External dependencies
 */
import { applyFormat } from '@wordpress/rich-text';
/**
 * Types
 */
import type { RichTextFormat, RichTextValue } from '@wordpress/rich-text/build-types/types';

const applyHighlightFormat = ( {
	content,
	type,
	indexes,
	attributes = {},
}: {
	content: RichTextValue;
	type: string;
	indexes: Array< { startIndex: number; endIndex: number } >;
	attributes: { [ key: string ]: string };
} ): RichTextValue => {
	let newContent = content;

	if ( indexes.length > 0 ) {
		newContent = indexes.reduce(
			(
				acc: RichTextValue,
				{ startIndex, endIndex }: { startIndex: number; endIndex: number }
			) => {
				const format = {
					type,
					attributes,
				} as RichTextFormat;

				return applyFormat( acc, format, startIndex, endIndex );
			},
			content
		);
	}

	return newContent;
};

export default function highlight( { content, type, indexes, attributes } ) {
	return applyHighlightFormat( { indexes, content, type, attributes } );
}

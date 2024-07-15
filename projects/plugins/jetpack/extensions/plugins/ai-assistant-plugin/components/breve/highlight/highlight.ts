/**
 * External dependencies
 */
import { applyFormat } from '@wordpress/rich-text';
/**
 * Types
 */
import type { RichTextFormat, RichTextValue } from '@wordpress/rich-text/build-types/types';

export type HighlightProps = {
	content: RichTextValue;
	type: string;
	indexes: Array< { startIndex: number; endIndex: number } >;
	attributes?: { [ key: string ]: string };
};

const applyHighlightFormat = ( {
	content,
	type,
	indexes,
	attributes = {},
}: HighlightProps ): RichTextValue => {
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

export default function highlight( { content, type, indexes, attributes }: HighlightProps ) {
	return applyHighlightFormat( { indexes, content, type, attributes } );
}

/**
 * External dependencies
 */
import { applyFormat } from '@wordpress/rich-text';
import md5 from 'crypto-js/md5';
/**
 * Types
 */
import type { HighlightedText } from '../types';
import type { RichTextFormat, RichTextValue } from '@wordpress/rich-text/build-types/types';

export type HighlightProps = {
	content: RichTextValue;
	type: string;
	indexes: Array< HighlightedText >;
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
		newContent = indexes
			.map( highlightedText => {
				const { startIndex, endIndex, text } = highlightedText;
				return { start: startIndex, end: endIndex, text } as RichTextValue;
			} )
			.reduce( ( acc: RichTextValue, { start, end, text }: RichTextValue ) => {
				const currentAttr = { ...attributes, 'data-id': md5( `${ text }-${ start }-${ end }` ) };

				const format = {
					type,
					attributes: currentAttr,
				} as RichTextFormat;

				return applyFormat( acc, format, start, end );
			}, content );
	}

	return newContent;
};

export default function highlight( { content, type, indexes, attributes }: HighlightProps ) {
	return applyHighlightFormat( { indexes, content, type, attributes } );
}

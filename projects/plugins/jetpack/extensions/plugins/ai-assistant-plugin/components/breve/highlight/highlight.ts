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
	ignored: Array< string >;
};

type HighlightData = {
	start: number;
	end: number;
	id: string;
};

const applyHighlightFormat = ( {
	content,
	type,
	indexes,
	attributes = {},
	ignored = [],
}: HighlightProps ): RichTextValue => {
	let newContent = content;

	if ( indexes.length > 0 ) {
		newContent = indexes
			.map( highlightedText => {
				const { startIndex, endIndex, text } = highlightedText;
				const id = md5( `${ text }-${ startIndex }-${ endIndex }` ).toString();
				return { start: startIndex, end: endIndex, id } as HighlightData;
			} )
			.filter( data => ! ignored.includes( data?.id ) )
			.reduce( ( acc: RichTextValue, { start, end, id }: HighlightData ) => {
				const currentAttr = { ...attributes, 'data-id': id };

				const format = {
					type,
					attributes: currentAttr,
				} as RichTextFormat;

				return applyFormat( acc, format, start, end );
			}, content );
	}

	return newContent;
};

export default function highlight( {
	content,
	type,
	indexes,
	attributes,
	ignored,
}: HighlightProps ) {
	return applyHighlightFormat( { indexes, content, type, attributes, ignored } );
}

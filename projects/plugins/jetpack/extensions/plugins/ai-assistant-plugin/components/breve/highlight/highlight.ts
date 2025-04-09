/**
 * External dependencies
 */
import { applyFormat } from '@wordpress/rich-text';
import { getAnchorIdFromText } from '../utils/get-anchor-id';
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
	text?: string;
};

type HighlightData = {
	start: number;
	end: number;
	anchorId: string;
};

const applyHighlightFormat = ( {
	content,
	type,
	indexes,
	attributes = {},
	ignored = [],
	text,
}: HighlightProps ): RichTextValue => {
	let newContent = content;

	if ( indexes.length > 0 ) {
		newContent = indexes
			.map( highlightedText => {
				const { startIndex, endIndex, text: highlightText } = highlightedText;
				const anchorId = getAnchorIdFromText( {
					text: text ?? highlightText,
					startIndex,
					endIndex,
					blockId: attributes[ 'data-block' ],
				} );
				return { start: startIndex, end: endIndex, anchorId } as HighlightData;
			} )
			.filter( data => ! ignored.includes( data?.anchorId ) )
			.reduce( ( acc: RichTextValue, { start, end, anchorId }: HighlightData ) => {
				const currentAttr = { ...attributes, 'data-id': anchorId };

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
	text,
}: HighlightProps ) {
	return applyHighlightFormat( { indexes, content, type, attributes, ignored, text } );
}

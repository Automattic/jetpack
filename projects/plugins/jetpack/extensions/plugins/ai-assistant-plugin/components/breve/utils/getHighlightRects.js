import config from '../dictionaries/dictionaries-config';
import { escapeRegExp } from './escapeRegExp';

const getWordRects = ( content, regex ) => {
	const ranges = [];
	const nodeIterator = document.createNodeIterator( content, window.NodeFilter.SHOW_TEXT );
	let currentNode;
	while ( ( currentNode = nodeIterator.nextNode() ) ) {
		let match;
		while ( ( match = regex.exec( currentNode.nodeValue ) ) ) {
			const range = document.createRange();
			range.setStart( currentNode, match.index );
			range.setEnd( currentNode, match.index + match[ 0 ].length );
			ranges.push( { range, text: match[ 0 ] } );
		}
	}
	return ranges;
};

export const getHighlightRects = element => {
	const rects = [];
	const textContent = element.innerText || element.textContent;

	const allRanges = [];

	for ( const key in config.dictionaries ) {
		const dictConfig = config.dictionaries[ key ];
		if ( dictConfig.type === 'function' ) {
			const ranges = dictConfig
				.function( textContent )
				.map( ( { regex } ) => getWordRects( element, regex ) )
				.flat();
			allRanges.push( ...ranges );
		} else {
			const dictionary = dictConfig.dictionary;
			let regex;
			if ( dictConfig.type === 'key-value' ) {
				regex = new RegExp(
					`\\b(${ Object.keys( dictionary ).map( escapeRegExp ).join( '|' ) })\\b`,
					'gi'
				);
			} else if ( dictConfig.type === 'list' ) {
				regex = new RegExp( `\\b(${ dictionary.map( escapeRegExp ).join( '|' ) })\\b`, 'gi' );
			}
			const ranges = getWordRects( element, regex );
			allRanges.push( ...ranges );
		}
	}

	allRanges.forEach( ( { range, text } ) => {
		const clientRects = Array.from( range.getClientRects() );
		clientRects.forEach( rect => {
			let type;
			let replacement = text.toLowerCase();

			for ( const key in config.dictionaries ) {
				const dictConfig = config.dictionaries[ key ];
				if ( dictConfig.type === 'key-value' && dictConfig.dictionary[ text.toLowerCase() ] ) {
					type = key;
					replacement = dictConfig.dictionary[ text.toLowerCase() ];
					break;
				} else if (
					dictConfig.type === 'list' &&
					dictConfig.dictionary.includes( text.toLowerCase() )
				) {
					type = key;
					break;
				} else if ( dictConfig.type === 'function' && key === 'long-sentence' ) {
					const longSentences = dictConfig
						.function( textContent )
						.map( ( { sentence } ) => sentence );
					if ( longSentences.includes( text ) ) {
						type = key;
						break;
					}
				}
			}

			if ( ! type ) {
				type = 'phrase';
			}

			rects.push( {
				rect,
				range,
				replacementText: `${ text }`, // The original text
				replacement, // It's replacement. TODO: Rename these to be clearer
				type,
				highlightId: `${ range.startOffset }${ text }${ range.endOffset }`,
			} );
		} );
	} );

	return rects;
};

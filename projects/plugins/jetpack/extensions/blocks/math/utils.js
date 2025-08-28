import katex from 'katex';

const allowedTags = [
	'math',
	'annotation',
	'semantics',
	'mtext',
	'mn',
	'mo',
	'mi',
	'mspace',
	'mover',
	'munder',
	'munderover',
	'msup',
	'msub',
	'msubsup',
	'mfrac',
	'mroot',
	'msqrt',
	'mtable',
	'mtr',
	'mtd',
	'mlabeledtr',
	'mrow',
	'menclose',
	'mstyle',
	'mpadded',
	'mphantom',
	'mglyph',
];

function stripTags( source ) {
	const parser = new DOMParser();
	const doc = parser.parseFromString( source, 'text/html' );
	const allowedTagsSet = new Set( allowedTags );

	for ( const element of doc.body.querySelectorAll( '*' ) ) {
		if ( ! allowedTagsSet.has( element.tagName ) ) {
			element.remove();
		}
	}

	return doc.body.innerHTML;
}

export function renderMath( source ) {
	if ( source.toLowerCase().includes( '<math' ) ) {
		return stripTags( source );
	}

	return katex.renderToString( source, {
		throwOnError: false,
		displayMode: false,
		output: 'mathml',
	} );
}

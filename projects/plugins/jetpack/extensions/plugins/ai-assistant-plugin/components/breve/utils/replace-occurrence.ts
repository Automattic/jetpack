export default function replaceOccurrence( {
	text,
	target,
	occurrence,
	replacement,
}: {
	text: string;
	target: string;
	occurrence: number;
	replacement: string;
} ) {
	const targetRegex = new RegExp( target, 'gi' );
	const matches = Array.from( text.matchAll( targetRegex ) ).map( match => match.index );
	const startIndex = matches[ occurrence - 1 ];
	const endIndex = startIndex + target.length;

	return text.substring( 0, startIndex ) + replacement + text.substring( endIndex );
}

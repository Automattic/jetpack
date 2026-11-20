import { getEncodedLines, getFlaggedRuns, getSegments } from '../threat-file';

const lines = [ '<?php', 'echo <<<HTML', 'STANDARD', 'HTML;', 'echo <<<HTML', 'CRITICAL', 'HTML;' ];
const block = ( first: number, codes: string[] ) =>
	codes.map( ( code, offset ) => ( { line: first + offset, code: `${ code }\n` } ) );

describe( 'getFlaggedRuns', () => {
	it.each( [
		[ 'at its line numbers', block( 5, [ 'echo <<<HTML', 'CRITICAL' ] ), [ [ 4, 5 ] ] ],
		[
			'by content when the numbers drifted',
			block( 0, [ 'echo <<<HTML', 'CRITICAL' ] ),
			[ [ 4, 5 ] ],
		],
		[
			'every place the whole block repeats',
			block( 0, [ 'HTML;' ] ),
			[
				[ 3, 3 ],
				[ 6, 6 ],
			],
		],
		[ 'nothing once the code is gone', block( 5, [ 'echo <<<HTML', 'LOW' ] ), [] ],
	] )( 'finds the block %s', ( _name, context, expected ) => {
		expect( getFlaggedRuns( lines, context ) ).toEqual( expected );
	} );
} );

describe( 'getSegments', () => {
	const shownLines = ( segments: ReturnType< typeof getSegments > ) =>
		segments.filter( ( { folded } ) => ! folded ).map( ( { start, end } ) => [ start, end ] );

	it.each( [
		[ 'a short file whole', 30, [ [ 12, 13 ] ], [], [ [ 0, 29 ] ] ],
		[ 'a long file without flags whole', 200, [], [], [ [ 0, 199 ] ] ],
		[ 'ten lines around a run', 200, [ [ 100, 101 ] ], [], [ [ 90, 111 ] ] ],
		[
			'nearby runs as one stretch',
			200,
			[
				[ 50, 50 ],
				[ 65, 65 ],
			],
			[],
			[ [ 40, 75 ] ],
		],
		[ 'a fold the user opened', 200, [ [ 100, 101 ] ], [ 0 ], [ [ 0, 111 ] ] ],
	] )( 'shows %s', ( _name, count, runs, expanded, expected ) => {
		expect(
			shownLines( getSegments( count, runs as [ number, number ][], new Set( expanded ) ) )
		).toEqual( expected );
	} );
} );

describe( 'getEncodedLines', () => {
	it( 'finds long base64 and hex-escaped strings, not ordinary code', () => {
		const code = [
			'echo 1;',
			`eval( base64_decode( '${ 'QUJD'.repeat( 60 ) }' ) );`,
			`$x = "${ '\\x41'.repeat( 25 ) }";`,
		];
		expect( getEncodedLines( code ) ).toEqual( [ 1, 2 ] );
	} );
} );

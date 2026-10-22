import { getFlaggedRuns } from '../threat-file';

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

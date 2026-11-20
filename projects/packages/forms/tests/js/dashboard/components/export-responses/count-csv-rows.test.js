/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';
/**
 * Internal dependencies
 */
import countCsvRows from '../../../../../src/dashboard/components/export-responses/count-csv-rows';

const encode = text => new TextEncoder().encode( text );
const countChunks = chunks =>
	chunks.reduce( ( count, chunk ) => countCsvRows( encode( chunk ), count ), {
		rows: 0,
		inQuotes: false,
	} ).rows;

describe( 'countCsvRows', () => {
	it.each( [
		[ 'plain rows', [ 'ID,Name\n1,Ann\n2,Bob\n' ], 3 ],
		[ 'a line break inside a quoted value', [ 'ID,Message\n1,"Hi\nthere"\n' ], 2 ],
		[ 'escaped quotes around a line break', [ '1,"She said ""hi\n"" twice"\n' ], 1 ],
		[ 'a chunk boundary inside a quoted value', [ '1,"Hi', '\nthere"\n2,x\n' ], 2 ],
		[ 'multi-byte characters', [ '1,"Žiga ✅\nüber"\n' ], 1 ],
	] )( 'counts %s', ( _, chunks, rows ) => {
		expect( countChunks( chunks ) ).toBe( rows );
	} );
} );

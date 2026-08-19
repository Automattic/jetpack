import { formatFileSize, toFileDetails } from '../use-path-info';
import type { PathInfoResponse } from '../../data/api/path-info';

const payload = ( overrides: Partial< PathInfoResponse > = {} ): PathInfoResponse => ( {
	size: 3247,
	hash: '2b468ca8798605890addf85864109793',
	mtime: 1748888135,
	...overrides,
} );

describe( 'toFileDetails', () => {
	test( 'reads size, hash and mtime from a resolved row', () => {
		expect( toFileDetails( payload() ) ).toEqual( {
			size: 3247,
			hash: '2b468ca8798605890addf85864109793',
			lastModified: '2025-06-02T18:15:35.000Z',
		} );
	} );

	// Upstream answers HTTP 200 with an `error` string when the file has
	// no row for that period, so the status code alone never reveals it.
	// Reading the body regardless would render `0 bytes` and an empty
	// hash as though they were real measurements of the file.
	test( 'treats a 200 carrying an error as no details at all', () => {
		expect(
			toFileDetails( payload( { error: 'No file found for the given manifest_path' } ) )
		).toEqual( { size: null, hash: null, lastModified: null } );
	} );

	test( 'returns nulls when nothing has been fetched yet', () => {
		expect( toFileDetails( undefined ) ).toEqual( {
			size: null,
			hash: null,
			lastModified: null,
		} );
	} );

	// Same hazard `toFileNode` guards for: `mtime` is unvalidated upstream
	// data, and `toISOString()` throws `RangeError` on an unrepresentable
	// date. A finite-but-out-of-range value — an mtime that arrives in
	// milliseconds rather than seconds — passes `Number.isFinite` and
	// still blows up, so the `Date` itself has to be tested.
	test.each( [
		[ 'out-of-range', 1748888135000000 ],
		[ 'not a number', NaN ],
	] )( 'drops lastModified rather than throwing on an %s mtime', ( _label, mtime ) => {
		let details;
		expect( () => {
			details = toFileDetails( payload( { mtime } ) );
		} ).not.toThrow();

		expect( details ).toMatchObject( { size: 3247, lastModified: null } );
	} );

	test( 'keeps size and hash when only mtime is missing', () => {
		expect( toFileDetails( payload( { mtime: undefined } ) ) ).toMatchObject( {
			size: 3247,
			lastModified: null,
		} );
	} );

	// A zero-byte file is a real file, and `0` is falsy — the reason this
	// is asserted rather than left to a truthiness check.
	test( 'reports a zero-byte file as 0, not as unknown', () => {
		expect( toFileDetails( payload( { size: 0 } ) ) ).toMatchObject( { size: 0 } );
	} );
} );

describe( 'formatFileSize', () => {
	test.each( [
		[ 0, '0 B' ],
		[ 512, '512 B' ],
		[ 1024, '1 KB' ],
		[ 3247, '3.2 KB' ],
		[ 1048576, '1 MB' ],
		[ 5368709120, '5 GB' ],
	] )( 'formats %i bytes as %s', ( bytes, expected ) => {
		expect( formatFileSize( bytes ) ).toBe( expected );
	} );
} );

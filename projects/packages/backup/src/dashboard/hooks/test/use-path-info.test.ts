import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { formatFileSize, toFileDetails, usePathInfo } from '../use-path-info';
import type { PathInfoResponse } from '../../data/api/path-info';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Fresh client per test, retries off so failures assert immediately.
 *
 * @return A wrapper providing an isolated QueryClient.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { wrapper };
}

const payload = ( overrides: Partial< PathInfoResponse > = {} ): PathInfoResponse => ( {
	size: '3247',
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

	// Two separate hazards, both landing on `lastModified: null`.
	//
	// The falsy group is the nastier one. `Number()` turns `null`, `''`
	// and `false` into `0`, which is a perfectly valid Date — 1 Jan 1970
	// — and its ISO string is *truthy*, so the card's
	// `lastModified ?? file.lastModified` fallback would prefer it and
	// display 1970 for a file whose real date it already had from `/ls`.
	// An mtime from a nullable upstream column is a plausible payload.
	//
	// The unrepresentable group is the `toFileNode` hazard: `Date` is
	// only defined within ±8.64e15 ms, so a microsecond-scale timestamp
	// is finite and still throws `RangeError` from `toISOString()`.
	test.each( [
		[ 'null', null ],
		[ 'zero', 0 ],
		[ 'empty string', '' ],
		[ 'false', false ],
		[ 'microsecond-scale', 1748888135000000 ],
		[ 'not a number', NaN ],
	] )( 'reports no lastModified for a %s mtime, never 1970', ( _label, mtime ) => {
		let details;
		expect( () => {
			details = toFileDetails( payload( { mtime: mtime as unknown as number } ) );
		} ).not.toThrow();

		expect( details ).toMatchObject( { size: 3247, lastModified: null } );
	} );

	test( 'keeps size and hash when only mtime is missing', () => {
		expect( toFileDetails( payload( { mtime: undefined } ) ) ).toMatchObject( {
			size: 3247,
			lastModified: null,
		} );
	} );

	// A zero-byte file is a real measurement the card must show as `0 B`
	// rather than suppress.
	test.each( [
		[ 'a decimal string', '7407', 7407 ],
		[ 'a number', 7407, 7407 ],
		[ 'a zero string', '0', 0 ],
		[ 'zero', 0, 0 ],
	] )( 'reads a size sent as %s', ( _label, size, expected ) => {
		expect( toFileDetails( payload( { size } ) ) ).toMatchObject( { size: expected } );
	} );

	// `0 B` for a file the endpoint never sized would be a lie, not a reading.
	test.each( [
		[ 'missing', undefined ],
		[ 'null', null ],
		[ 'an empty string', '' ],
		[ 'whitespace', '   ' ],
		[ 'a non-numeric string', 'unknown' ],
	] )( 'reports no size when it is %s, never 0', ( _label, size ) => {
		expect(
			toFileDetails( payload( { size: size as PathInfoResponse[ 'size' ] } ) )
		).toMatchObject( { size: null } );
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

describe( 'usePathInfo', () => {
	beforeEach( () => {
		mockedApiFetch.mockReset();
	} );

	test( 'sends the file period and the raw manifest path, and projects the reply', async () => {
		mockedApiFetch.mockResolvedValue( payload() );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => usePathInfo( '1748888135', 'f5:/wp-config.php' ), {
			wrapper,
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/rewind/backup/path-info?file_period=1748888135&manifest_path=f5%3A%2Fwp-config.php',
		} );
		expect( result.current ).toMatchObject( {
			size: 3247,
			hash: '2b468ca8798605890addf85864109793',
			lastModified: '2025-06-02T18:15:35.000Z',
		} );
	} );

	// The card's hooks run before a file is chosen, and folder rows from
	// `/ls` carry no manifest path at all. Both params are required
	// upstream, so firing anyway would spend a request to earn a 400.
	test.each( [
		[ 'the period is missing', undefined, 'f5:/wp-config.php' ],
		[ 'the manifest path is missing', '1748888135', undefined ],
		[ 'the period is empty', '', 'f5:/wp-config.php' ],
		[ 'both are missing', undefined, undefined ],
	] )( 'issues no request when %s', ( _label, period, manifestPath ) => {
		const { wrapper } = makeWrapper();

		renderHook( () => usePathInfo( period, manifestPath ), { wrapper } );

		expect( mockedApiFetch ).not.toHaveBeenCalled();
	} );

	// How the card suppresses the fetch for a file it will not render
	// details for.
	test( 'issues no request when disabled despite having both params', () => {
		const { wrapper } = makeWrapper();

		renderHook( () => usePathInfo( '1748888135', 'f5:/wp-config.php', false ), { wrapper } );

		expect( mockedApiFetch ).not.toHaveBeenCalled();
	} );
} );

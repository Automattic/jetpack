import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { flattenFontFamilyPresets, useFontFamilyPresets } from '../use-font-family-presets';
import type { ReactNode } from 'react';

const preset = ( slug: string ) => ( { slug, name: slug, fontFamily: `${ slug }, serif` } );

const wrapper = ( { children }: { children: ReactNode } ) => (
	<QueryClientProvider client={ new QueryClient() }>{ children }</QueryClientProvider>
);

describe( 'flattenFontFamilyPresets', () => {
	it( 'lists custom, theme then default presets without duplicate slugs', () => {
		expect(
			flattenFontFamilyPresets( {
				default: [ preset( 'system' ), preset( 'body' ) ],
				theme: [ preset( 'body' ), preset( 'heading' ) ],
				custom: [ preset( 'brand' ) ],
			} ).map( p => p.slug )
		).toEqual( [ 'brand', 'body', 'heading', 'system' ] );
	} );

	it( 'accepts a plain list and nothing at all', () => {
		expect( flattenFontFamilyPresets( [ preset( 'a' ) ] ) ).toEqual( [ preset( 'a' ) ] );
		expect( flattenFontFamilyPresets( undefined ) ).toEqual( [] );
	} );
} );

describe( 'useFontFamilyPresets', () => {
	it( "reads the active theme's presets", async () => {
		const api = mockApiFetch( async ( { path } ) =>
			path?.startsWith( '/wp/v2/themes' )
				? [ { stylesheet: 'twentytwentyfour' } ]
				: { settings: { typography: { fontFamilies: { theme: [ preset( 'heading' ) ] } } } }
		);
		const { result } = renderHook( () => useFontFamilyPresets(), { wrapper } );

		await waitFor( () => expect( result.current ).toEqual( [ preset( 'heading' ) ] ) );
		expect( api ).toHaveBeenCalledWith( { path: '/wp/v2/global-styles/themes/twentytwentyfour' } );
	} );

	it( 'is empty without an active theme', async () => {
		const api = mockApiFetch( async () => [] );
		const { result } = renderHook( () => useFontFamilyPresets(), { wrapper } );

		await waitFor( () => expect( api ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current ).toEqual( [] );
	} );
} );

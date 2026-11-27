import { renderHook } from '@testing-library/react';
import { useCornerstoneSummary } from './cornerstone-pages';

jest.mock( './lib/stores/cornerstone-pages', () => ( {
	useCustomCornerstonePages: () => [ [ '/about' ] ],
} ) );

test( 'summarizes the homepage and the custom pages', () => {
	const { result } = renderHook( () => useCornerstoneSummary() );
	expect( result.current ).toBe( 'Homepage + 1 page' );
} );

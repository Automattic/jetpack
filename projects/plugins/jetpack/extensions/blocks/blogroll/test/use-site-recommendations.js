import { renderHook } from '@testing-library/react';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useSiteRecommendationSync } from '../use-site-recommendations';

jest.mock( '@wordpress/core-data', () => ( { useEntityProp: jest.fn() } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { insertBlocks: jest.fn() } ),
	useSelect: jest.fn(),
} ) );
jest.mock( '../utils', () => ( { createBlockFromRecommendation: jest.fn() } ) );

const item = { id: '1', name: 'Example', icon: 'https://example.com/moon/placeholder.svg' };
const saved = [ { ...item, icon: 'https://example.com/sun/placeholder.svg' } ];
const setSiteRecommendations = jest.fn();
const mount = () => renderHook( () => useSiteRecommendationSync( { clientId: 'blogroll' } ) );

beforeEach( () => {
	setSiteRecommendations.mockClear();
	useEntityProp.mockReturnValue( [ saved, setSiteRecommendations ] );
	useSelect.mockReturnValue( [ item ] );
} );

it( 'leaves the site setting alone on load, even when it differs from the block', () => {
	mount();
	expect( setSiteRecommendations ).not.toHaveBeenCalled();
} );

it( 'saves the items to the site setting once they change', () => {
	const { rerender } = mount();
	const changed = [ item, { id: '2', name: 'Other' } ];
	useSelect.mockReturnValue( changed );
	rerender();
	expect( setSiteRecommendations ).toHaveBeenCalledWith( changed );
} );

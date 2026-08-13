import { seedViewFromSearch } from '../stage';
import type { View } from '@wordpress/dataviews';

// Only the pure seeding helper is under test; the stage component itself pulls
// in the full dashboard and is covered by the E2E path.
jest.mock( '@wordpress/route', () => ( {
	useNavigate: jest.fn(),
	useSearch: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {} ),
	isWoASite: jest.fn( () => false ),
	isSimpleSite: jest.fn( () => false ),
	siteHasFeature: jest.fn( () => false ),
} ) );
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: jest.fn(),
} ) );

const BASE_VIEW: View = {
	type: 'grid',
	page: 1,
	perPage: 12,
	fields: [],
	filters: [],
	search: '',
	sort: { field: 'uploadDate', direction: 'desc' },
};

describe( 'seedViewFromSearch', () => {
	it( 'passes the view through untouched without the param', () => {
		expect( seedViewFromSearch( BASE_VIEW, {} ) ).toBe( BASE_VIEW );
		expect( seedViewFromSearch( BASE_VIEW, { type: 'videopress' } ) ).toBe( BASE_VIEW );
	} );

	it( 'seeds the local type filter for ?type=local', () => {
		const seeded = seedViewFromSearch( BASE_VIEW, { type: 'local' } );

		expect( seeded.filters ).toEqual( [ { field: 'type', value: 'local', operator: 'is' } ] );
		// Everything else about the persisted view survives.
		expect( seeded.type ).toBe( BASE_VIEW.type );
		expect( seeded.sort ).toBe( BASE_VIEW.sort );
	} );

	it( 'replaces, not appends, any persisted filters', () => {
		const withFilters: View = {
			...BASE_VIEW,
			filters: [ { field: 'type', value: 'videopress', operator: 'is' } ],
		};

		const seeded = seedViewFromSearch( withFilters, { type: 'local' } );

		expect( seeded.filters ).toEqual( [ { field: 'type', value: 'local', operator: 'is' } ] );
	} );
} );

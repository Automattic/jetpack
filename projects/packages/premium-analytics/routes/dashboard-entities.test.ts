import { ensureDashboardEntities } from './dashboard-entities';

const mockGetEntityConfig = jest.fn();
const mockAddEntities = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	select: () => ( { getEntityConfig: mockGetEntityConfig } ),
	dispatch: () => ( { addEntities: mockAddEntities } ),
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

/**
 * The names registered by the single `addEntities` call, if any.
 *
 * @return The registered entity names.
 */
function registeredNames(): string[] {
	return mockAddEntities.mock.calls.flatMap( ( [ entities ] ) =>
		( entities as { name: string }[] ).map( entity => entity.name )
	);
}

describe( 'ensureDashboardEntities', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'registers every requested entity on a fresh store', () => {
		mockGetEntityConfig.mockReturnValue( undefined );

		ensureDashboardEntities( [ 'widgetModule', 'dashboardSection' ] );

		expect( mockAddEntities ).toHaveBeenCalledTimes( 1 );
		expect( registeredNames() ).toEqual( [ 'widgetModule', 'dashboardSection' ] );
	} );

	it( 'registers dashboardSection even when a detail route already registered widgetModule', () => {
		// Regression: entering via a detail page registers only `widgetModule`;
		// a later dashboard beforeLoad must still register `dashboardSection`
		// instead of treating the store as fully seeded.
		mockGetEntityConfig.mockImplementation( ( _kind: string, name: string ) =>
			name === 'widgetModule' ? {} : undefined
		);

		ensureDashboardEntities( [ 'widgetModule', 'dashboardSection' ] );

		expect( registeredNames() ).toEqual( [ 'dashboardSection' ] );
	} );

	it( 'does nothing when every requested entity is registered', () => {
		mockGetEntityConfig.mockReturnValue( {} );

		ensureDashboardEntities( [ 'widgetModule' ] );

		expect( mockAddEntities ).not.toHaveBeenCalled();
	} );

	it( 'builds the entity configs the stage hooks expect', () => {
		mockGetEntityConfig.mockReturnValue( undefined );

		ensureDashboardEntities( [ 'widgetModule', 'dashboardSection' ] );

		const [ widgetModule, dashboardSection ] = mockAddEntities.mock.calls[ 0 ][ 0 ];
		expect( widgetModule ).toMatchObject( {
			kind: 'root',
			key: 'name',
			baseURL: '/wpcom/v2/widget-modules',
			plural: 'widgetModules',
			supportsPagination: false,
		} );
		expect( dashboardSection ).toMatchObject( {
			kind: 'root',
			key: 'slug',
			baseURL: '/wpcom/v2/dashboards/jetpack-premium-analytics_dashboard/sections',
			plural: 'dashboardSections',
			supportsPagination: false,
		} );
	} );
} );

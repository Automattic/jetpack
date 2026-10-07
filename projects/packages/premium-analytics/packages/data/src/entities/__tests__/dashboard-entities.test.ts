/**
 * External dependencies
 */
import { dispatch, select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { ensureDashboardEntities } from '../dashboard-entities';

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
	dispatch: jest.fn(),
	resolveSelect: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

describe( 'ensureDashboardEntities', () => {
	const getEntityConfig = jest.fn();
	const addEntities = jest.fn();

	/**
	 * The names registered by the single `addEntities` call, if any.
	 *
	 * @return The registered entity names.
	 */
	function registeredNames(): string[] {
		return addEntities.mock.calls.flatMap( ( [ entities ] ) =>
			( entities as { name: string }[] ).map( entity => entity.name )
		);
	}

	beforeEach( () => {
		getEntityConfig.mockReset();
		addEntities.mockReset();
		jest
			.mocked( select )
			.mockReturnValue( { getEntityConfig } as unknown as ReturnType< typeof select > );
		jest.mocked( dispatch ).mockReturnValue( { addEntities } );
	} );

	it( 'registers the complete entity set on a fresh store', () => {
		getEntityConfig.mockReturnValue( undefined );

		ensureDashboardEntities();

		expect( addEntities ).toHaveBeenCalledTimes( 1 );
		expect( registeredNames() ).toEqual( [ 'widgetModule', 'dashboardSection' ] );

		const [ widgetModule, dashboardSection ] = addEntities.mock.calls[ 0 ][ 0 ];
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

	it( 'registers dashboardSection even when widgetModule is already registered', () => {
		// Regression: an older detail-route guard registered only `widgetModule`,
		// and the dashboard treated its presence as "the store is fully seeded".
		getEntityConfig.mockImplementation( ( _kind: string, name: string ) =>
			name === 'widgetModule' ? {} : undefined
		);

		ensureDashboardEntities();

		expect( registeredNames() ).toEqual( [ 'dashboardSection' ] );
	} );

	it( 'does nothing when every entity is registered', () => {
		getEntityConfig.mockReturnValue( {} );

		ensureDashboardEntities();

		expect( addEntities ).not.toHaveBeenCalled();
	} );
} );

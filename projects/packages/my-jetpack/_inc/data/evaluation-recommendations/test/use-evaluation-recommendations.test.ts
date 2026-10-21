import { renderHook } from '@testing-library/react';
import useEvaluationRecommendations from '../use-evaluation-recommendations';

jest.mock( '../../../context/value-store/valueStoreContext', () => ( {
	useValueStore: ( _key: string, initial: unknown ) => [ initial, jest.fn() ],
} ) );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );
jest.mock( '../../../hooks/use-is-jetpack-user-new', () => ( {
	__esModule: true,
	default: () => true,
} ) );
jest.mock( '../../products/use-products-by-ownership', () => ( {
	__esModule: true,
	default: () => ( { data: { ownedProducts: [ 'stats' ] }, isLoading: false } ),
} ) );
jest.mock( '../../use-simple-mutation', () => ( {
	__esModule: true,
	default: () => ( { mutate: jest.fn() } ),
} ) );

describe( 'useEvaluationRecommendations', () => {
	afterEach( () => {
		delete window.myJetpackInitialState;
	} );

	it( 'never recommends a product a host hid', () => {
		window.myJetpackInitialState = {
			recommendedModules: {
				modules: [ 'search', 'backup', 'stats', 'boost' ],
				isFirstRun: false,
				dismissed: false,
			},
			hiddenFeatures: [ 'search' ],
		} as unknown as typeof window.myJetpackInitialState;

		const { result } = renderHook( () => useEvaluationRecommendations() );

		expect( result.current.recommendedModules ).toEqual( [ 'backup', 'boost' ] );
	} );
} );

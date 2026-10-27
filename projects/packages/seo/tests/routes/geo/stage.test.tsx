import { jest } from '@jest/globals';

const setEnhancer = jest.fn();
const setLlmsTxt = jest.fn();
const setCrawlers = jest.fn();
const useEnsureTabData = jest.fn<
	( requests: Array< { seed?: ( body: unknown ) => void } > ) => {
		status: 'loading';
		retry: () => void;
	}
>();

jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( { setEnhancer, setLlmsTxt, setCrawlers } ),
	useSelect: jest.fn(),
} ) );
// The stage is invoked as a plain function below (it's the seed wiring under test,
// not the rendered tree), so the hooks it calls are stubbed rather than run through
// a renderer: `useEffect` would be an invalid hook call outside a component, and
// `useNavigate` would reach for a router that isn't mounted.
jest.unstable_mockModule( '@wordpress/element', () => ( {
	useCallback: ( fn: unknown ) => fn,
	useEffect: () => undefined,
} ) );
jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
} ) );
// Ungated: the gated path returns early without reaching the seed wiring.
jest.unstable_mockModule( '../../../_inc/data/is-gated', () => ( {
	isGated: () => false,
} ) );
jest.unstable_mockModule( '../../../_inc/components/dashboard-load-error', () => ( {
	default: () => null,
} ) );
jest.unstable_mockModule( '../../../_inc/components/dashboard-skeleton', () => ( {
	default: () => null,
} ) );
jest.unstable_mockModule( '../../../_inc/components/seo-disabled-stage', () => ( {
	default: () => null,
} ) );
jest.unstable_mockModule( '../../../_inc/dashboard/dashboard-page', () => ( {
	default: ( { children }: { children: React.ReactNode } ) => children,
} ) );
jest.unstable_mockModule( '../../../_inc/data/geo-store', () => ( { geoStore: 'geo' } ) );
jest.unstable_mockModule( '../../../_inc/data/get-preloaded', () => ( {
	GEO_PATH: '/jetpack/v4/seo/geo',
	OVERVIEW_PATH: '/jetpack/v4/seo/overview',
} ) );
jest.unstable_mockModule( '../../../_inc/data/get-overview', () => ( {
	default: jest.fn(),
} ) );
jest.unstable_mockModule( '../../../_inc/data/is-seo-tools-active', () => ( {
	default: () => true,
} ) );
jest.unstable_mockModule( '../../../_inc/data/settings-store', () => ( {
	settingsStore: 'settings',
} ) );
jest.unstable_mockModule( '../../../_inc/data/use-geo', () => ( {
	useGeoForm: jest.fn(),
} ) );
jest.unstable_mockModule( '../../../_inc/data/use-ensure-tab-data', () => ( {
	default: useEnsureTabData,
} ) );
jest.unstable_mockModule( '../../../_inc/screens/geo', () => ( {
	default: () => null,
} ) );

const { stage: Stage } = await import( '../../../routes/geo/stage' );

describe( 'GEO route stage', () => {
	it( 'seeds every form slice from a recovered GEO response', () => {
		let seed: ( body: unknown ) => void = () => undefined;
		useEnsureTabData.mockImplementation( requests => {
			seed = requests[ 1 ].seed ?? seed;
			return { status: 'loading', retry: jest.fn() };
		} );

		Stage();
		const geo = {
			enhancer: { available: true, enabled: false, aiSeoEnabled: true, aiEnabled: true },
			llmsTxt: { enabled: true, url: 'https://example.com/llms.txt', canServe: true },
			crawlers: { catalog: [], blocked: { answer: [], training: [] } },
		};
		seed( geo );

		expect( setEnhancer ).toHaveBeenCalledWith( geo.enhancer );
		expect( setLlmsTxt ).toHaveBeenCalledWith( geo.llmsTxt );
		expect( setCrawlers ).toHaveBeenCalledWith( geo.crawlers );
	} );
} );

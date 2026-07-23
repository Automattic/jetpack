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
jest.unstable_mockModule( '../../../_inc/data/ai-store', () => ( { aiStore: 'ai' } ) );
jest.unstable_mockModule( '../../../_inc/data/get-preloaded', () => ( {
	AI_PATH: '/jetpack/v4/seo/ai',
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
jest.unstable_mockModule( '../../../_inc/data/use-ai', () => ( {
	useAiForm: jest.fn(),
} ) );
jest.unstable_mockModule( '../../../_inc/data/use-ensure-tab-data', () => ( {
	default: useEnsureTabData,
} ) );
jest.unstable_mockModule( '../../../_inc/screens/ai', () => ( {
	default: () => null,
} ) );

const { stage: Stage } = await import( '../../../routes/ai/stage' );

describe( 'AI route stage', () => {
	it( 'seeds every form slice from a recovered AI response', () => {
		let seed: ( body: unknown ) => void = () => undefined;
		useEnsureTabData.mockImplementation( requests => {
			seed = requests[ 1 ].seed ?? seed;
			return { status: 'loading', retry: jest.fn() };
		} );

		Stage();
		const ai = {
			enhancer: { available: true, enabled: false },
			llmsTxt: { enabled: true, url: 'https://example.com/llms.txt', canServe: true },
			crawlers: { catalog: [], overrides: {} },
		};
		seed( ai );

		expect( setEnhancer ).toHaveBeenCalledWith( ai.enhancer );
		expect( setLlmsTxt ).toHaveBeenCalledWith( ai.llmsTxt );
		expect( setCrawlers ).toHaveBeenCalledWith( ai.crawlers );
	} );
} );

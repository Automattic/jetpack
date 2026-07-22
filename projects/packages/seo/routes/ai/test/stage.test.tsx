import { jest } from '@jest/globals';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the stage dynamically after the mocks are registered.
const navigate = jest.fn();
const isGated = jest.fn< () => boolean >();
const isSeoToolsActive = jest.fn< () => boolean >( () => true );
const useEnsureTabData = jest.fn( () => ( { status: 'success', retry: jest.fn() } ) );

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => navigate,
} ) );

jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( { setEnhancer: jest.fn() } ),
} ) );

jest.unstable_mockModule( '../../../_inc/data/is-gated', () => ( {
	isGated,
} ) );

jest.unstable_mockModule( '../../../_inc/data/is-seo-tools-active', () => ( {
	default: isSeoToolsActive,
} ) );

jest.unstable_mockModule( '../../../_inc/data/use-ensure-tab-data', () => ( {
	default: useEnsureTabData,
} ) );

// The AI store self-registers on import (needs @wordpress/data internals the mock
// above doesn't provide), and the form controller, screen and dashboard shell
// pull in heavy deps unrelated to the redirect; stub them all. The gated path
// returns before any is reached anyway.
jest.unstable_mockModule( '../../../_inc/data/ai-store', () => ( {
	aiStore: {},
} ) );
jest.unstable_mockModule( '../../../_inc/data/use-ai', () => ( {
	useAiForm: () => ( {} ),
} ) );
jest.unstable_mockModule( '../../../_inc/screens/ai', () => ( {
	default: () => <div>ai screen</div>,
} ) );
jest.unstable_mockModule( '../../../_inc/components/seo-disabled-stage', () => ( {
	default: () => <div>seo disabled</div>,
} ) );
jest.unstable_mockModule( '../../../_inc/dashboard/dashboard-page', () => ( {
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

const { stage: Stage } = await import( '../stage' );

describe( 'AI (GEO) route stage — gating redirect', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		isSeoToolsActive.mockReturnValue( true );
		useEnsureTabData.mockReturnValue( { status: 'success', retry: jest.fn() } );
	} );

	it( 'redirects to Overview and renders nothing when gated', () => {
		isGated.mockReturnValue( true );

		const { container } = render( <Stage /> );

		expect( navigate ).toHaveBeenCalledWith( { href: '/' } );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not redirect when not gated', () => {
		isGated.mockReturnValue( false );

		render( <Stage /> );

		expect( navigate ).not.toHaveBeenCalled();
	} );
} );

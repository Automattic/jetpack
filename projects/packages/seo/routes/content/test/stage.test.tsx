import { jest } from '@jest/globals';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the stage dynamically after the mocks are registered.
const navigate = jest.fn();
const isGated = jest.fn< () => boolean >();
const isSeoToolsActive = jest.fn< () => boolean >( () => true );

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => navigate,
} ) );

jest.unstable_mockModule( '../../../_inc/data/is-gated', () => ( {
	isGated,
} ) );

jest.unstable_mockModule( '../../../_inc/data/is-seo-tools-active', () => ( {
	default: isSeoToolsActive,
} ) );

// The content screen, the dashboard shell and the disabled stage pull in heavy
// deps that aren't relevant to the redirect; stub them so the stage renders in
// isolation. The gated path returns before any of them is reached anyway.
jest.unstable_mockModule( '../../../_inc/screens/content', () => ( {
	default: () => <div>content screen</div>,
} ) );
jest.unstable_mockModule( '../../../_inc/components/seo-disabled-stage', () => ( {
	default: () => <div>seo disabled</div>,
} ) );
jest.unstable_mockModule( '../../../_inc/dashboard/dashboard-page', () => ( {
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

const { stage: Stage } = await import( '../stage' );

describe( 'Content route stage — gating redirect', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		isSeoToolsActive.mockReturnValue( true );
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

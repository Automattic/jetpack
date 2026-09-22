/* No jest-dom in this project; the sibling check needs direct node access. */
/* eslint-disable jest-dom/prefer-in-document, testing-library/no-node-access */
import { render, renderHook, screen } from '@testing-library/react';
import CornerstonePages, { useCornerstoneSummary } from './cornerstone-pages';

jest.mock( './meta/meta', () => ( {
	__esModule: true,
	default: () => <div>editor</div>,
	CornerstonePagesUpgradeCTA: () => <div>upgrade</div>,
} ) );
jest.mock( './prerender/prerender', () => () => <div>prerender</div> );
jest.mock( './lib/stores/cornerstone-pages', () => ( {
	useCustomCornerstonePages: () => [ [ '/about' ] ],
} ) );
jest.mock( '$features/module/lib/stores', () => ( {
	useSingleModuleState: () => [ { active: false, available: true } ],
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

describe( 'CornerstonePages', () => {
	it( 'describes the feature under the title while the panel is collapsed', () => {
		render( <CornerstonePages /> );

		const title = screen.getByRole( 'heading', { level: 3, name: 'Cornerstone Pages' } );
		const description = screen.getByText(
			'Choose the pages that matter most on your site so Boost can give them its most targeted optimizations.'
		);

		expect( description.tagName ).toBe( 'P' );
		expect( title.nextElementSibling ).toBe( description );
		expect( screen.getByText( 'Added: Homepage + 1 page' ) ).toBeTruthy();
		expect( screen.queryByText( 'editor' ) ).toBeNull();
	} );
} );

test( 'omits the modern summary prefix while keeping the legacy prefix', () => {
	const { result: modern } = renderHook( () => useCornerstoneSummary( false ) );
	const { result: legacy } = renderHook( () => useCornerstoneSummary() );
	expect( modern.current ).toBe( 'Homepage + 1 page' );
	expect( legacy.current ).toBe( 'Added: Homepage + 1 page' );
} );

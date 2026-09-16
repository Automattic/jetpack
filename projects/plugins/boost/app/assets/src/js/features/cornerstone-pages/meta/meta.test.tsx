/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-value, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import Meta, {
	CornerstonePagesDescription,
	CornerstonePagesEditor,
	CornerstonePagesUpgradeCTA,
} from './meta';

jest.mock( '../lib/stores/cornerstone-pages', () => ( {
	useCornerstonePagesProperties: () => mockProperties,
	useCustomCornerstonePages: () => [ [ 'https://example.com/about' ], jest.fn() ],
} ) );
jest.mock( '$features/critical-css/lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( { mutate: jest.fn() } ),
} ) );
jest.mock( '$features/critical-css/lib/stores/suggest-regenerate', () => ( {
	useRegenerationReason: () => [ { refetch: jest.fn() } ],
} ) );
jest.mock( '$features/lcp/lib/stores/lcp-state', () => ( {
	useLcpState: () => [ { refetch: jest.fn() } ],
} ) );
jest.mock( '$features/module/lib/stores', () => ( {
	useModulesState: () => [ { data: {} } ],
} ) );
jest.mock( '$features/notice/context', () => ( {
	useNotices: () => ( { setNotice: jest.fn() } ),
} ) );
jest.mock(
	'$features/upgrade-cta/interstitial-modal-cta',
	() => ( props: { description: string } ) => <div>{ props.description }</div>
);
jest.mock( '$lib/stores/premium-features', () => ( {
	usePremiumFeatures: () => mockPremiumFeatures,
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
jest.mock( '@automattic/jetpack-components', () => ( {
	Button: ( props: React.ComponentProps< 'button' > ) => <button { ...props } />,
	getRedirectUrl: ( slug: string ) => `https://jetpack.com/redirect/?source=${ slug }`,
} ) );

let mockProperties:
	| {
			max_pages: number;
			max_pages_premium: number;
			default_pages: string[];
			predefined_pages: string[];
	  }
	| undefined;
let mockPremiumFeatures: string[];

describe( 'Cornerstone pages meta', () => {
	beforeEach( () => {
		mockProperties = {
			max_pages: 5,
			max_pages_premium: 10,
			default_pages: [ 'https://example.com/' ],
			predefined_pages: [ 'https://example.com/' ],
		};
		mockPremiumFeatures = [];
		( globalThis as unknown as { Jetpack_Boost: unknown } ).Jetpack_Boost = {
			site: { url: 'https://example.com/' },
		};
		jest.clearAllMocks();
	} );

	it( 'links the description to the support page and records the click', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		render( <CornerstonePagesDescription /> );

		const link = screen.getByRole( 'link', { name: /^Learn More/ } );
		expect( link.getAttribute( 'href' ) ).toBe(
			'https://jetpack.com/redirect/?source=jetpack-boost-cornerstone-pages'
		);
		fireEvent.click( link );
		expect( recordBoostEvent ).toHaveBeenCalledWith( 'clicked_cornerstone_pages_learn_more', {} );
	} );

	it( 'renders the page lists in the editor when the properties load', () => {
		render( <CornerstonePagesEditor /> );

		expect( screen.getByText( 'Homepage:' ) ).toBeTruthy();
		expect( ( screen.getByRole( 'textbox' ) as HTMLTextAreaElement ).value ).toBe(
			'https://example.com/about'
		);
	} );

	it( 'falls back to an error notice when the properties fail to load', () => {
		mockProperties = undefined;
		render( <CornerstonePagesEditor /> );

		expect( screen.getByText( 'Failed to load' ) ).toBeTruthy();
		expect( screen.queryByRole( 'textbox' ) ).toBeNull();
	} );

	it( 'offers the premium page limit only to free sites with loaded properties', () => {
		const { rerender } = render( <CornerstonePagesUpgradeCTA /> );
		expect( screen.getByText( 'Premium users can add up to 10 cornerstone pages.' ) ).toBeTruthy();

		mockPremiumFeatures = [ 'cornerstone-10-pages' ];
		rerender( <CornerstonePagesUpgradeCTA /> );
		expect( screen.queryByText( /Premium users/ ) ).toBeNull();

		mockPremiumFeatures = [];
		mockProperties = undefined;
		rerender( <CornerstonePagesUpgradeCTA /> );
		expect( screen.queryByText( /Premium users/ ) ).toBeNull();
	} );

	it( 'stacks the description and editor in the legacy panel', () => {
		render( <Meta /> );

		expect( screen.getByRole( 'link', { name: /^Learn More/ } ) ).toBeTruthy();
		expect( screen.getByRole( 'textbox' ) ).toBeTruthy();
	} );
} );

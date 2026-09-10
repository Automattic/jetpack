/* No jest-dom in this project, and the hidden-but-mounted assertion needs the node itself. */
/* eslint-disable jest-dom/prefer-in-document, testing-library/no-container, testing-library/no-node-access */
import { render, screen } from '@testing-library/react';
import ModernSettings from './modern-settings';

jest.mock( '$lib/stores/premium-features', () => ( {
	usePremiumFeatures: () => mockPremiumFeatures,
} ) );
jest.mock( '../../pages/index', () => ( {
	__esModule: true,
	default: () => <div>settings body</div>,
} ) );
jest.mock( '$layout/settings-page/tips/tips', () => ( {
	__esModule: true,
	default: () => <div>tips</div>,
} ) );
jest.mock( '$layout/settings-page/support/support', () => ( {
	__esModule: true,
	default: () => <div>priority support</div>,
} ) );
jest.mock( '$features/notice/manager', () => ( {
	__esModule: true,
	default: () => <div>notices</div>,
} ) );

let mockPremiumFeatures: string[] = [];

describe( 'ModernSettings', () => {
	beforeEach( () => {
		mockPremiumFeatures = [];
	} );

	it( 'renders the settings body without the chassis-owned header or speed scores', () => {
		const { container } = render( <ModernSettings /> );

		expect( screen.getByText( 'settings body' ) ).toBeTruthy();
		expect( container.querySelector( '.jb-dashboard' ) ).toBeNull();
	} );

	it( 'shows priority support only on a plan that includes it', () => {
		const view = render( <ModernSettings /> );
		expect( screen.queryByText( 'priority support' ) ).toBeNull();
		view.unmount();

		mockPremiumFeatures = [ 'support' ];
		render( <ModernSettings /> );

		expect( screen.getByText( 'priority support' ) ).toBeTruthy();
	} );

	it( 'hides itself without unmounting while a redirect is pending', () => {
		const { container } = render( <ModernSettings hidden /> );

		expect( screen.getByText( 'settings body' ) ).toBeTruthy();
		expect( container.querySelector( '[hidden]' ) ).not.toBeNull();
	} );
} );

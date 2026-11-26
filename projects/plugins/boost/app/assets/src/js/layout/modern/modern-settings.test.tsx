/* No jest-dom or user-event in this project, and the hidden and tooltip assertions need the nodes themselves. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content, testing-library/prefer-user-event, testing-library/no-container, testing-library/no-node-access */
import { fireEvent, render, screen } from '@testing-library/react';
import ModernSettings from './modern-settings';

jest.mock( '$features/image-cdn/lib/stores', () => ( {
	useImageCdnQuality: () => [
		{
			data: {
				jpg: { quality: 75, lossless: false },
				png: { quality: 60, lossless: false },
				webp: { quality: 65, lossless: false },
			},
		},
		{ mutate: jest.fn() },
	],
} ) );
jest.mock( '$features/ui/mutation-notice/mutation-notice', () => ( {
	useMutationNotice: jest.fn(),
} ) );
jest.mock( '../../pages/settings/settings', () => {
	const QualitySettings = jest.requireActual(
		'$features/image-cdn/quality-settings/quality-settings'
	).default;
	return {
		__esModule: true,
		default: ( { active = true }: { active?: boolean } ) => (
			<>
				<div data-testid="settings-active">{ String( active ) }</div>
				<div>settings body</div>
				<div data-testid="card">
					<QualitySettings isPremium />
				</div>
			</>
		),
	};
} );
jest.mock( '$features/notice/manager', () => ( {
	__esModule: true,
	default: ( { modern }: { modern?: boolean } ) => (
		<div>{ modern ? 'modern notices' : 'legacy notices' }</div>
	),
} ) );

describe( 'ModernSettings', () => {
	it( 'renders the settings body without the chassis-owned header or speed scores', () => {
		render( <ModernSettings /> );

		expect( screen.getByText( 'settings body' ) ).toBeTruthy();
		expect( screen.getByText( 'modern notices' ) ).toBeTruthy();
	} );

	it( 'hides itself without unmounting while a redirect is pending', () => {
		const { container } = render( <ModernSettings hidden /> );

		expect( screen.getByText( 'settings body' ) ).toBeTruthy();
		expect( container.querySelector( '[hidden]' ) ).not.toBeNull();
	} );

	it( 'enables exposure only for an active dashboard without a hidden redirect', () => {
		const view = render( <ModernSettings hidden /> );
		expect( screen.getByTestId( 'settings-active' ).textContent ).toBe( 'false' );
		view.rerender( <ModernSettings active={ false } /> );
		expect( screen.getByTestId( 'settings-active' ).textContent ).toBe( 'false' );
		view.rerender( <ModernSettings /> );
		expect( screen.getByTestId( 'settings-active' ).textContent ).toBe( 'true' );
	} );

	it( 'opens card tooltips outside the card, which clips its overflow', () => {
		const { container } = render( <ModernSettings /> );
		const card = screen.getByTestId( 'card' );

		fireEvent.click( screen.getByRole( 'button', { name: 'How image quality works' } ) );

		const title = screen.getByText( /Select the quality for images served by the CDN/, {
			ignore: '#a11y-speak-polite, script, style',
		} );
		expect( card.contains( title ) ).toBe( false );
		expect( container.querySelector( '.jb-modern-settings-popovers' )?.contains( title ) ).toBe(
			true
		);
	} );
} );

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import JetpackFooter from '../index.tsx';

describe( 'JetpackFooter', () => {
	const className = 'sample-classname';

	afterEach( () => {
		delete window.JetpackNetworkAdminData;
	} );

	describe( 'Render the component', () => {
		const menu = [
			{
				label: 'Link',
				href: '/',
			},
			{
				label: 'Button link',
				onClick: () => {},
			},
		];

		it( 'should include a footer tag', () => {
			render( <JetpackFooter /> );

			const element = screen.getByRole( 'contentinfo', { name: 'Jetpack' } );

			expect( element ).toBeInTheDocument();
		} );

		it( 'should apply the class name', () => {
			render( <JetpackFooter className={ className } /> );

			const element = screen.getByRole( 'contentinfo' );

			expect( element ).toHaveClass( className );
		} );

		it( 'should render the Jetpack logo', () => {
			render( <JetpackFooter /> );

			const element = screen.getByLabelText( 'Jetpack' );

			expect( element ).toBeInTheDocument();
		} );

		it( 'should render Jetpack as regular text', () => {
			render( <JetpackFooter /> );

			const element = screen.getByText( 'Jetpack' );

			expect( element ).toBeInTheDocument();
			expect( element ).not.toBeInstanceOf( HTMLAnchorElement );
		} );

		it( 'should render the Automattic logo', () => {
			render( <JetpackFooter /> );

			const element = screen.getByText( 'An Automattic Airline', {
				selector: '#jp-automattic-byline-logo-title',
			} );

			expect( element ).toBeInTheDocument();
		} );

		it( 'should render the links', () => {
			render( <JetpackFooter menu={ menu } /> );

			const link = screen.getByRole( 'link', { name: menu[ 0 ].label } );
			const button = screen.getByRole( 'button', { name: menu[ 1 ].label } );

			expect( link ).toBeInTheDocument();
			expect( button ).toBeInTheDocument();
			expect( button ).toHaveAttribute( 'tabindex', '0' );
		} );

		it( 'should hide default links when JetpackNetworkAdminData is present', () => {
			window.JetpackNetworkAdminData = {
				sitesUrl: '/',
				settingsUrl: '/',
			};

			render( <JetpackFooter /> );

			expect( screen.queryByRole( 'link', { name: 'Products' } ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'link', { name: 'Help' } ) ).not.toBeInTheDocument();
		} );

		it( 'should match the snapshot', () => {
			const { container } = render( <JetpackFooter className={ className } menu={ menu } /> );
			expect( container ).toMatchSnapshot( 'all props' );
		} );
	} );

	describe( 'Fire events', () => {
		const onClick = jest.fn();
		const onKeyDown = jest.fn();
		const menu = [
			{
				label: 'Link',
				href: '/',
				onClick,
				onKeyDown,
			},
		];

		it( 'should call the menu item onClick function', async () => {
			const user = userEvent.setup();

			render( <JetpackFooter menu={ menu } /> );

			const element = screen.getByRole( 'link', { name: menu[ 0 ].label } );

			await user.click( element );

			expect( onClick ).toHaveBeenCalled();
		} );

		it( 'should call the menu item onKeyDown function', async () => {
			const user = userEvent.setup();

			render( <JetpackFooter menu={ menu } /> );

			const element = screen.getByRole( 'link', { name: menu[ 0 ].label } );

			// Need to focus on element first
			await user.click( element );
			await user.keyboard( '[Enter]' );

			expect( onKeyDown ).toHaveBeenCalled();
		} );
	} );
} );

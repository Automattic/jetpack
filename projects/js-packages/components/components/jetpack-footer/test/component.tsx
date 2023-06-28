import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import JetpackFooter from '../index';

describe( 'JetpackFooter', () => {
	const className = 'sample-classname';
	const moduleName = 'Test module';
	const moduleNameHref = 'https://jetpack.com/path/to-some-page';
	const a8cLogoHref = 'https://automattic.com';

	describe( 'Render the component', () => {
		const menu = [
			{
				label: 'Link',
				href: '/',
			},
			{
				label: 'External link',
				href: '/',
				target: '_blank',
			},
			{
				label: 'Button link',
				href: '/',
				role: 'button',
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

		it( 'should render the module name as a link', () => {
			render( <JetpackFooter moduleName={ moduleName } moduleNameHref={ moduleNameHref } /> );

			const element = screen.getByText( moduleName );

			expect( element ).toBeInTheDocument();
			expect( element ).toBeInstanceOf( HTMLAnchorElement );
			expect( element ).toHaveAttribute( 'href', moduleNameHref );
		} );

		it( 'should render the module name as regular text', () => {
			render( <JetpackFooter moduleName={ moduleName } moduleNameHref={ null } /> );

			const element = screen.getByText( moduleName );

			expect( element ).toBeInTheDocument();
			expect( element ).not.toBeInstanceOf( HTMLAnchorElement );
		} );

		it( 'should render the Automattic logo', () => {
			render( <JetpackFooter a8cLogoHref={ a8cLogoHref } /> );

			const element = screen.getByLabelText( 'An Automattic Airline', { selector: 'a' } );

			expect( element ).toBeInTheDocument();
			expect( element ).toHaveAttribute( 'href', a8cLogoHref );
		} );

		it( 'should render a list', () => {
			render( <JetpackFooter menu={ menu } /> );

			const element = screen.getByRole( 'list' );

			expect( element ).toBeInTheDocument();
			// eslint-disable-next-line testing-library/no-node-access
			expect( element.children ).toHaveLength( 2 + menu.length );
		} );

		it( 'should render the links', () => {
			render( <JetpackFooter menu={ menu } /> );

			const link = screen.getByRole( 'link', { name: menu[ 0 ].label } );
			const externalLink = screen.getByRole( 'link', { name: menu[ 1 ].label } );
			const button = screen.getByRole( 'button', { name: menu[ 2 ].label } );

			expect( link ).toBeInTheDocument();

			expect( externalLink ).toBeInTheDocument();
			expect( externalLink ).toHaveAttribute( 'target', '_blank' );
			expect( externalLink ).toHaveAttribute( 'rel', 'noopener noreferrer' );
			expect( externalLink ).toContainHTML( 'svg' );

			expect( button ).toBeInTheDocument();
			expect( button ).toHaveAttribute( 'tabindex', '0' );
		} );

		it( 'should match the snapshot', () => {
			const { container } = render(
				<JetpackFooter
					className={ className }
					moduleName={ moduleName }
					moduleNameHref={ moduleNameHref }
					a8cLogoHref={ a8cLogoHref }
					menu={ menu }
				/>
			);
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

		it( 'should call the menu item onClick function', () => {
			render( <JetpackFooter menu={ menu } /> );

			const element = screen.getByRole( 'link', { name: menu[ 0 ].label } );

			fireEvent.click( element );

			expect( onClick ).toHaveBeenCalled();
		} );

		it( 'should call the menu item onKeyDown function', () => {
			render( <JetpackFooter menu={ menu } /> );

			const element = screen.getByRole( 'link', { name: menu[ 0 ].label } );

			fireEvent.keyDown( element );

			expect( onKeyDown ).toHaveBeenCalled();
		} );
	} );
} );

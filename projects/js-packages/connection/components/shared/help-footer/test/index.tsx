import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpFooter from '../index';

describe( 'HelpFooter', () => {
	const testProps = {
		namespace: 'jp-test-namespace',
		onLearnClick: jest.fn(),
		onSupportClick: jest.fn(),
	};

	afterEach( () => {
		testProps.onLearnClick.mockClear();
		testProps.onSupportClick.mockClear();
	} );

	it( 'renders the "Jetpack connection" and "contact Jetpack support" links', () => {
		render( <HelpFooter { ...testProps } /> );
		expect(
			screen.getByRole( 'link', { name: 'Jetpack connection(opens in a new tab)' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: 'contact Jetpack support(opens in a new tab)' } )
		).toBeInTheDocument();
	} );

	it( 'builds link class names from the passed namespace', () => {
		render( <HelpFooter { ...testProps } /> );
		expect( screen.getByRole( 'link', { name: /Jetpack connection/ } ) ).toHaveClass(
			'jp-test-namespace__link'
		);
	} );

	it( 'does not render a trailing period by default', () => {
		const { container } = render( <HelpFooter { ...testProps } /> );
		expect( container ).not.toHaveTextContent( /support\./ );
	} );

	it( 'renders a trailing period when trailingPeriod is true', () => {
		const { container } = render( <HelpFooter { ...testProps } trailingPeriod /> );
		expect( container ).toHaveTextContent( /support\./ );
	} );

	it( 'calls onLearnClick when the connection link is clicked', async () => {
		const user = userEvent.setup();
		render( <HelpFooter { ...testProps } /> );
		await user.click( screen.getByRole( 'link', { name: /Jetpack connection/ } ) );
		expect( testProps.onLearnClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls onSupportClick when the support link is clicked', async () => {
		const user = userEvent.setup();
		render( <HelpFooter { ...testProps } /> );
		await user.click( screen.getByRole( 'link', { name: /contact Jetpack support/ } ) );
		expect( testProps.onSupportClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders using a custom wrapper element when provided', () => {
		render( <HelpFooter { ...testProps } wrapper="section" /> );
		expect( screen.getByText( 'Need help?', { selector: 'section strong' } ) ).toBeInTheDocument();
	} );
} );

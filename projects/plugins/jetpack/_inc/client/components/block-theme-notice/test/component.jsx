import { render, screen } from 'test/test-utils';
import BlockThemeNotice from '../index';

// Mock the @automattic/jetpack-components module
jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: jest.fn( key => `https://jetpack.com/redirect/?source=${ key }` ),
} ) );

describe( 'BlockThemeNotice', () => {
	it( 'renders the notice when module is active', () => {
		render(
			<BlockThemeNotice isModuleActive={ true } redirectSlug="jetpack-support-sharing-block" />
		);

		expect(
			screen.getByText( /We recommend that you disable this legacy feature/ )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Discover how/i } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-sharing-block'
		);
	} );

	it( 'renders the notice when module is inactive', () => {
		render( <BlockThemeNotice isModuleActive={ false } redirectSlug="jetpack-support-likes" /> );

		expect( screen.getByText( /Instead of enabling this legacy feature/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Discover how/i } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-likes'
		);
	} );

	it( 'does not show dismiss button', () => {
		render(
			<BlockThemeNotice isModuleActive={ true } redirectSlug="jetpack-support-sharing-block" />
		);

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );
} );

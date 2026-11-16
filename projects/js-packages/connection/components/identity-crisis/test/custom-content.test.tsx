import { render, screen } from '@testing-library/react';
import { getSupportUrl, renderCustomContent } from '../custom-content';

describe( 'getSupportUrl', () => {
	it.each( [ 'javascript:alert(1)', '/relative', [ 'x' ] ] )(
		'ignores a plugin support URL of %j',
		supportURL => {
			expect( getSupportUrl( { supportURL } as never ) ).toMatch( /^https:\/\// );
		}
	);
} );

describe( 'renderCustomContent', () => {
	it.each( [ undefined, '', { title: 'x' }, [ 'x' ], 5 ] )(
		'uses the default when the override is %j',
		override => {
			render( <>{ renderCustomContent( override, 'Default text' ) }</> );

			expect( screen.getByText( 'Default text' ) ).toBeInTheDocument();
		}
	);

	it( 'renders the tags an override from the earlier screen uses', () => {
		render(
			<>
				{ renderCustomContent(
					'Moved to <hostname>shop.example</hostname>. <safeModeLink>Help</safeModeLink>',
					'Default text',
					{ supportURL: 'https://example.com/help' }
				) }
			</>
		);

		expect( screen.getByText( 'shop.example' ).tagName ).toBe( 'STRONG' );
		expect( screen.getByRole( 'link', { name: 'Help' } ) ).toHaveAttribute(
			'href',
			'https://example.com/help'
		);
	} );

	it( 'shows an override with an unknown tag as text instead of breaking the screen', () => {
		render( <>{ renderCustomContent( 'Hi <foo>x</foo>', 'Default text' ) }</> );

		expect( screen.getByText( 'Hi <foo>x</foo>' ) ).toBeInTheDocument();
	} );
} );

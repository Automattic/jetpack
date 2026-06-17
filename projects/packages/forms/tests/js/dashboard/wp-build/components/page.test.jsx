/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

await jest.unstable_mockModule( '@wordpress/admin-ui', () => ( {
	Page: ( { children, className, ...props } ) => (
		<section className={ className } data-testid="page" { ...props }>
			{ children }
		</section>
	),
} ) );

await jest.unstable_mockModule( '@automattic/jetpack-components/jetpack-footer', () => ( {
	default: () => <footer data-testid="footer" />,
} ) );

const { default: FormsPage } = await import(
	'../../../../../src/dashboard/wp-build/components/page/index.tsx'
);

describe( 'FormsPage', () => {
	it( 'adds a stable Forms shell class for scoped wp-admin styling', () => {
		const { container } = render(
			<FormsPage title="Forms">
				<div>Responses</div>
			</FormsPage>
		);

		expect( container.firstElementChild ).toHaveClass( 'jp-admin-page' );
		expect( container.firstElementChild ).toHaveClass( 'jp-forms-admin-page' );
		expect( screen.getByTestId( 'page' ) ).toHaveClass( 'jp-admin-page__page' );
	} );
} );

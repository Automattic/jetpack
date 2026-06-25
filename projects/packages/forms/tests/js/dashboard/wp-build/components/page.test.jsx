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
		render(
			<FormsPage title="Forms">
				<div>Responses</div>
			</FormsPage>
		);

		const page = screen.getByTestId( 'page' );
		// eslint-disable-next-line testing-library/no-node-access -- The wrapper class is the behavior under test.
		const shell = page.parentElement;

		expect( shell ).toHaveClass( 'jp-admin-page' );
		expect( shell ).toHaveClass( 'jp-forms-admin-page' );
		expect( page ).toHaveClass( 'jp-admin-page__page' );
	} );
} );

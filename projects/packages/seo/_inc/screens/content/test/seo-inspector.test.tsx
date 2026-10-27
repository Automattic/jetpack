import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
// The record, the entity config and the stores are stubbed so the inspector
// renders a loaded post without core-data or REST.
jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: {},
	useEntityRecord: () => ( {
		editedRecord: {
			meta: { jetpack_seo_html_title: 'Custom title' },
			title: { rendered: 'Hello world' },
			link: 'https://example.com/hello-world/',
		},
		isResolving: false,
	} ),
} ) );
// Spread the real module: `@wordpress/components` and friends import more of it.
const wpData = await import( '@wordpress/data' );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	...wpData,
	useDispatch: () => ( {
		editEntityRecord: jest.fn(),
		createInfoNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		applyCoverageDelta: jest.fn(),
	} ),
	useSelect: () => '/wp/v2/posts',
} ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: {} } ) );
jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: jest.fn() } ) );
jest.unstable_mockModule( '../../../data/coverage-store', () => ( { coverageStore: {} } ) );

const { default: SeoInspector } = await import( '../seo-inspector' );

describe( 'SeoInspector', () => {
	// The footer is pinned to the bottom of the sidebar with CSS (`position: sticky`),
	// which jsdom can't lay out. What it can check is the structure that relies on:
	// the actions share their own row, after and outside the scrolling fields.
	it( 'puts Cancel and Save in their own footer row, after the fields', () => {
		render( <SeoInspector postId={ 1 } postType="post" onClose={ jest.fn() } /> );

		const save = screen.getByRole( 'button', { name: 'Save' } );
		// eslint-disable-next-line testing-library/no-node-access -- the footer row is the layout under test.
		const footer = save.parentElement as HTMLElement;

		expect( within( footer ).getByRole( 'button', { name: 'Cancel' } ) ).toBeInTheDocument();
		expect( footer ).not.toContainElement( screen.getByRole( 'textbox', { name: 'SEO title' } ) );
		// eslint-disable-next-line testing-library/no-node-access -- the footer must be the editor's last row.
		expect( footer.parentElement?.lastElementChild ).toBe( footer );
	} );

	it( 'keeps Cancel before Save, so the primary action sits at the end', () => {
		render( <SeoInspector postId={ 1 } postType="post" onClose={ jest.fn() } /> );

		const buttons = within(
			// eslint-disable-next-line testing-library/no-node-access -- the footer row is the layout under test.
			screen.getByRole( 'button', { name: 'Save' } ).parentElement as HTMLElement
		).getAllByRole( 'button' );

		expect( buttons.map( button => button.textContent ) ).toEqual( [ 'Cancel', 'Save' ] );
	} );

	it( 'closes on Cancel', () => {
		const onClose = jest.fn();
		render( <SeoInspector postId={ 1 } postType="post" onClose={ onClose } /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn), matching the sibling tests.
		fireEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onClose ).toHaveBeenCalled();
	} );
} );

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// True-ESM Jest: register mocks, then import the inspector. Only the data/REST edges
// and the layout wrappers are stubbed; the form controls are real.
const mockApiFetch = jest.fn< ( options: { data: { meta: object } } ) => Promise< unknown > >();
let meta: Record< string, unknown > = {};

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityRecord: () => ( { editedRecord: { meta }, isResolving: false } ),
} ) );
// Spread the real module: the form controls' dependencies register stores with it.
const actualData = jest.requireActual< object >( '@wordpress/data' );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	...actualData,
	useDispatch: () => ( {
		editEntityRecord: jest.fn(),
		createInfoNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		applyCoverageDelta: jest.fn(),
	} ),
	useSelect: () => '/wp/v2/pages',
} ) );
jest.unstable_mockModule( '../../../data/coverage-store', () => ( {
	coverageStore: 'seo/coverage',
} ) );
jest.unstable_mockModule( '@wordpress/admin-ui', () => ( {
	Page: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
jest.unstable_mockModule( '@automattic/jetpack-components/sidebar-footer', () => ( {
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
jest.unstable_mockModule( '../serp-preview', () => ( { default: () => null } ) );

const { default: SeoInspector } = await import( '../seo-inspector' );

const LABEL = 'Always include in llms.txt';

describe( 'SeoInspector — Always include in llms.txt', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( {} );
	} );

	it.each( [
		[ 'page', true ],
		[ 'post', undefined ],
	] )( 'saves the switch only for a %s that has it', async ( postType, expected ) => {
		meta = { jetpack_seo_noindex: false, jetpack_seo_llms_txt_include: false };
		render( <SeoInspector postId={ 1 } postType={ postType } onClose={ jest.fn() } /> );

		const toggle = screen.queryByLabelText( LABEL );
		/* eslint-disable testing-library/prefer-user-event -- No user-event devDep for two clicks. */
		if ( toggle ) {
			fireEvent.click( toggle );
		}
		fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		/* eslint-enable testing-library/prefer-user-event */

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		const saved = mockApiFetch.mock.calls[ 0 ][ 0 ].data.meta as Record< string, unknown >;
		expect( saved.jetpack_seo_llms_txt_include ).toBe( expected );
	} );

	it( 'switches it off when the page is hidden from search', async () => {
		meta = { jetpack_seo_noindex: false, jetpack_seo_llms_txt_include: true };
		render( <SeoInspector postId={ 1 } postType="page" onClose={ jest.fn() } /> );

		/* eslint-disable testing-library/prefer-user-event -- No user-event devDep for two clicks. */
		fireEvent.click( screen.getByLabelText( 'Hide from search engines' ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		/* eslint-enable testing-library/prefer-user-event */

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].data.meta ).toHaveProperty(
			'jetpack_seo_llms_txt_include',
			false
		);
	} );

	it( 'shows the switch off and disabled while the page is hidden from search', () => {
		meta = { jetpack_seo_noindex: true, jetpack_seo_llms_txt_include: true };
		render( <SeoInspector postId={ 1 } postType="page" onClose={ jest.fn() } /> );

		const toggle = screen.getByLabelText( LABEL );
		expect( toggle ).not.toBeChecked();
		expect( toggle ).toBeDisabled();
	} );
} );

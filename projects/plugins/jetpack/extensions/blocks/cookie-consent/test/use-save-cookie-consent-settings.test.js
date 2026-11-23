import { act, render } from '@testing-library/react';
import { serialize } from '@wordpress/blocks';
import { useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { CookieConsentSettings } from '../use-save-cookie-consent-settings';

jest.mock( '@wordpress/blocks', () => ( { serialize: jest.fn() } ) );
jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityProp: jest.fn(),
} ) );
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = { useDispatch: jest.fn(), useSelect: jest.fn() };
	return new Proxy( actual, {
		get: ( target, property ) => mocks[ property ] ?? target[ property ],
	} );
} );

beforeEach( () => jest.clearAllMocks() );

it.each( [
	[ 'leaving a page preview', 'post', 'page', false, true ],
	[ 'leaving a post preview', 'post', 'post', false, true ],
	[ 'deleting from a template', 'site-editor', 'wp_template', false, false ],
	[ 'deleting from a Page Editor template', 'post', 'wp_template', false, false ],
	[ 'deleting from a template part', 'post', 'wp_template_part', false, false ],
	[ 'removing page content in the Site Editor', 'site-editor', 'page', false, false ],
	[ 'unmounting an existing block', 'site-editor', 'wp_template', true, true ],
	[ 'returning from Edit template', 'post', 'wp_template', false, true, 'page' ],
	[ 'returning from Edit template part', 'post', 'wp_template_part', false, true, 'post' ],
] )(
	'preserves the saved banner only when appropriate after %s',
	async (
		_label,
		screenBase,
		postType,
		blockRemains,
		preservesBanner,
		finalPostType = postType
	) => {
		const banner = '<!-- wp:jetpack/cookie-consent /-->';
		let savedTemplate = banner;
		let currentPostType = postType;
		let block = { clientId: 'banner', name: 'jetpack/cookie-consent' };
		const stores = {
			'core/editor': {
				isSavingPost: () => false,
				isSavingNonPostEntityChanges: () => false,
				getCurrentPostType: () => currentPostType,
			},
			'core/block-editor': { getBlock: () => block },
		};
		useSelect.mockImplementation( selector =>
			typeof selector === 'function' ? selector( store => stores[ store ] ) : stores[ selector ]
		);
		let editedTemplate = banner;
		useEntityProp.mockReturnValue( [ banner, template => ( editedTemplate = template ) ] );
		useDispatch.mockReturnValue( {
			saveEditedEntityRecord: async () => {
				savedTemplate = editedTemplate;
			},
		} );

		const initialState = window.Jetpack_Editor_Initial_State;
		try {
			window.Jetpack_Editor_Initial_State = { screenBase };
			const { unmount } = render( <CookieConsentSettings clientId="banner" /> );
			currentPostType = finalPostType;
			if ( ! blockRemains ) {
				block = undefined;
			}
			await act( async () => unmount() );

			expect( savedTemplate ).toBe( preservesBanner ? banner : null );
		} finally {
			window.Jetpack_Editor_Initial_State = initialState;
		}
	}
);

it.each( [
	[ 'post', 'page', false ],
	[ 'post', 'post', false ],
	[ 'post', 'wp_template', true ],
	[ 'post', 'wp_template_part', true ],
	[ 'site-editor', 'page', true ],
] )(
	'accesses and saves site settings only in editable contexts: %s / %s',
	async ( screenBase, postType, shouldSave ) => {
		const banner = '<!-- wp:jetpack/cookie-consent /-->';
		const updatedBanner = '<!-- wp:jetpack/cookie-consent {"text":"Updated"} /-->';
		const block = { clientId: 'banner', name: 'jetpack/cookie-consent' };
		let isSaving = false;
		let savedTemplate = banner;
		let editedTemplate = banner;
		const stores = {
			'core/editor': {
				isSavingPost: () => isSaving,
				isSavingNonPostEntityChanges: () => false,
				getCurrentPostType: () => postType,
			},
			'core/block-editor': { getBlock: () => block },
		};
		useSelect.mockImplementation( selector =>
			typeof selector === 'function' ? selector( store => stores[ store ] ) : stores[ selector ]
		);
		useEntityProp.mockReturnValue( [ banner, template => ( editedTemplate = template ) ] );
		useDispatch.mockReturnValue( {
			saveEditedEntityRecord: async () => {
				savedTemplate = editedTemplate;
			},
		} );
		serialize.mockReturnValue( updatedBanner );

		const initialState = window.Jetpack_Editor_Initial_State;
		try {
			window.Jetpack_Editor_Initial_State = { screenBase };
			const { rerender, unmount } = render( <CookieConsentSettings clientId="banner" /> );
			isSaving = true;
			rerender( <CookieConsentSettings clientId="banner" /> );
			isSaving = false;
			await act( async () => rerender( <CookieConsentSettings clientId="banner" /> ) );

			expect( savedTemplate ).toBe( shouldSave ? updatedBanner : banner );
			expect( useEntityProp.mock.calls.length > 0 ).toBe( shouldSave );
			unmount();
		} finally {
			window.Jetpack_Editor_Initial_State = initialState;
		}
	}
);

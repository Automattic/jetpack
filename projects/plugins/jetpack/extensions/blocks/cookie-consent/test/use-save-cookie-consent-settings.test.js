import { act, renderHook } from '@testing-library/react';
import { useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useSaveCookieConsentSettings } from '../use-save-cookie-consent-settings';

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

it.each( [
	[ 'hiding a page template', 'post', 'page', 'template-locked', 'post-only', false, true ],
	[ 'hiding a post template', 'post', 'post', 'template-locked', 'post-only', false, true ],
	[
		'deleting from a template',
		'site-editor',
		'wp_template',
		'post-only',
		'post-only',
		false,
		false,
	],
	[
		'deleting from a Page Editor template',
		'post',
		'wp_template',
		'post-only',
		'post-only',
		false,
		false,
	],
	[
		'deleting from a template part',
		'post',
		'wp_template_part',
		'post-only',
		'post-only',
		false,
		false,
	],
	[
		'deleting from a Site Editor page',
		'site-editor',
		'page',
		'post-only',
		'post-only',
		false,
		false,
	],
	[
		'unmounting an existing block',
		'site-editor',
		'wp_template',
		'post-only',
		'post-only',
		true,
		true,
	],
] )(
	'preserves the saved banner only when appropriate after %s',
	async ( _label, screenBase, postType, initialMode, finalMode, blockRemains, preservesBanner ) => {
		const banner = '<!-- wp:jetpack/cookie-consent /-->';
		let savedTemplate = banner;
		let renderingMode = initialMode;
		let block = { clientId: 'banner', name: 'jetpack/cookie-consent' };
		const stores = {
			'core/editor': {
				isSavingPost: () => false,
				isSavingNonPostEntityChanges: () => false,
				getCurrentPostType: () => postType,
				getRenderingMode: () => renderingMode,
			},
			'core/block-editor': { getBlock: () => block },
		};
		useSelect.mockImplementation( selector =>
			typeof selector === 'function' ? selector( store => stores[ store ] ) : stores[ selector ]
		);
		useEntityProp.mockReturnValue( [ banner, jest.fn() ] );
		useDispatch.mockReturnValue( {
			saveEditedEntityRecord: async ( _kind, _name, _id, settings ) => {
				savedTemplate = settings.cookie_consent_template;
			},
		} );

		const initialState = window.Jetpack_Editor_Initial_State;
		try {
			window.Jetpack_Editor_Initial_State = { screenBase };
			const { unmount } = renderHook( () => useSaveCookieConsentSettings( 'banner' ) );
			renderingMode = finalMode;
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

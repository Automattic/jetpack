import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { TemplatePlacements } from '../components/template-placements';
import { LikeButtonsSection } from '../sections/like-buttons-section';
import {
	apiCalls,
	baseSettings,
	baseStatus,
	renderWithData,
	resetNotices,
	setScriptData,
} from './helpers';
import type { Feature, Settings, Status, TemplatePlacement } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const PAGE_TEMPLATE_URL = 'https://example.com/wp-admin/site-editor.php?p=page';

const KEYS = { sharing: 'sharing_buttons_auto_add', likes: 'likes_auto_add' } as const;

/**
 * A promise and the functions that settle it.
 *
 * @return Deferred.
 */
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason: unknown ) => void;
	const promise = new Promise< T >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

/**
 * Render the cards with a placement list for the feature.
 *
 * @param feature - Feature.
 * @param stored  - The feature's placements.
 * @param status  - Status overrides.
 * @return Render result.
 */
function renderCards(
	feature: Feature,
	stored: TemplatePlacement[],
	status: Partial< Status > = {}
) {
	return renderWithData( <TemplatePlacements feature={ feature } fallback={ <p>fallback</p> } />, {
		status: { ...baseStatus, ...status },
		settings: { ...baseSettings, [ KEYS[ feature ] ]: stored },
	} );
}

/**
 * The card's checkbox.
 *
 * @param name - Card title.
 * @return Checkbox.
 */
function card( name: string ) {
	return screen.getByRole( 'checkbox', { name } );
}

/**
 * The "Preview and edit" links, by the card title they sit under.
 *
 * @return Titles of the cards showing a link.
 */
function cardsWithPreview(): string[] {
	return [ 'Before the content', 'After the content' ].filter( title =>
		within( screen.getByText( title ).parentElement as HTMLElement ).queryByRole( 'link', {
			name: 'Preview and edit',
		} )
	);
}

beforeEach( () => {
	mockApiFetch.mockReset();
	resetNotices();
	setScriptData();
} );

afterEach( () => {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

describe( 'TemplatePlacements', () => {
	// Sending both sides gets a 400; sending a diff would leave the other side in place.
	it.each( [
		[ 'sharing', [], 'Before the content', [ 'before_content' ] ],
		[ 'sharing', [ 'after_content' ], 'Before the content', [ 'before_content' ] ],
		[ 'sharing', [ 'after_content' ], 'After the content', [] ],
		[ 'likes', [ 'before_content' ], 'After the content', [ 'after_content' ] ],
		[ 'likes', [ 'before_content' ], 'Before the content', [] ],
	] as [ Feature, TemplatePlacement[], string, TemplatePlacement[] ][] )(
		'%s: from %j, clicking "%s" saves %j and ticks only that',
		async ( feature, stored, clicked, sent ) => {
			const user = userEvent.setup();
			mockApiFetch.mockImplementation( ( { data } ) =>
				Promise.resolve( { ...baseSettings, ...( data as Settings ) } )
			);
			renderCards( feature, stored );

			await user.click( card( clicked ) );

			expect( apiCalls( 'PUT' ) ).toEqual( [
				{
					path: '/wpcom/v2/sharing-likes/settings',
					method: 'PUT',
					data: { [ KEYS[ feature ] ]: sent },
				},
			] );
			expect( card( 'Before the content' ) ).toHaveAttribute(
				'aria-checked',
				String( sent.includes( 'before_content' ) )
			);
			expect( card( 'After the content' ) ).toHaveAttribute(
				'aria-checked',
				String( sent.includes( 'after_content' ) )
			);
		}
	);

	it( 'rolls the cards back when the save is refused', async () => {
		const user = userEvent.setup();
		const save = deferred< Settings >();
		const stored: Settings = { ...baseSettings, sharing_buttons_auto_add: [ 'after_content' ] };
		mockApiFetch.mockImplementation( ( { path, method } ) => {
			if ( method === 'PUT' ) {
				return save.promise;
			}
			return Promise.resolve( path?.endsWith( '/settings' ) ? stored : baseStatus );
		} );
		renderCards( 'sharing', [ 'after_content' ] );

		await user.click( card( 'Before the content' ) );
		expect( card( 'Before the content' ) ).toHaveAttribute( 'aria-checked', 'true' );
		save.reject( {
			code: 'rest_invalid_param',
			message: 'Invalid parameter(s): sharing_buttons_auto_add',
		} );

		await waitFor( () =>
			expect( card( 'After the content' ) ).toHaveAttribute( 'aria-checked', 'true' )
		);
		expect( card( 'Before the content' ) ).toHaveAttribute( 'aria-checked', 'false' );
	} );

	// The link opens the template, which only has the block once the save lands.
	it.each( [
		[ [ 'after_content' ], baseStatus.site_editor_url, [ 'After the content' ] ],
		[ [ 'after_content' ], '', [] ],
		[ [], baseStatus.site_editor_url, [] ],
	] as [ TemplatePlacement[], string, string[] ][] )(
		'with %j saved and Site Editor URL "%s", links %j to the single template',
		( stored, url, linked ) => {
			renderCards( 'likes', stored, { site_editor_url: url } );

			expect( cardsWithPreview() ).toEqual( linked );
			screen
				.queryAllByRole( 'link', { name: 'Preview and edit' } )
				.forEach( link => expect( link ).toHaveAttribute( 'href', url ) );
		}
	);

	it( 'only links a ticked card once its save lands', async () => {
		const user = userEvent.setup();
		const save = deferred< Settings >();
		mockApiFetch.mockImplementation( ( { method } ) =>
			method === 'PUT' ? save.promise : Promise.resolve( baseStatus )
		);
		renderCards( 'sharing', [ 'after_content' ] );

		await user.click( card( 'Before the content' ) );

		expect( cardsWithPreview() ).toEqual( [] );
		save.resolve( { ...baseSettings, sharing_buttons_auto_add: [ 'before_content' ] } );
		await waitFor( () => expect( cardsWithPreview() ).toEqual( [ 'Before the content' ] ) );
	} );

	it.each( [ PAGE_TEMPLATE_URL, '' ] )( 'links the page template only with a URL: "%s"', url => {
		renderCards( 'sharing', [], { page_template_editor_url: url } );

		// By text: an anchor with an empty href has no link role, so a role query would pass on a broken link.
		expect( screen.queryByText( 'Edit the page template' )?.getAttribute( 'href' ) ).toBe(
			url || undefined
		);
	} );

	// The status lands before settings are read again, so for a moment the variant has no placements to show.
	it( 'shows the cards disabled, not the Site Editor button, while settings catch up with a switch', async () => {
		const user = userEvent.setup();
		const settings = deferred< Settings >();
		mockApiFetch.mockImplementation( ( { path, method } ) => {
			if ( method === 'POST' ) {
				return Promise.resolve( {
					...baseStatus,
					likes: { state: 'block_call_to_action', supported: true },
				} );
			}
			return path?.endsWith( '/settings' ) ? settings.promise : Promise.resolve( baseStatus );
		} );
		renderWithData( <LikeButtonsSection />, {
			status: { ...baseStatus, likes: { state: 'configure_with_block_nudge', supported: true } },
		} );

		await user.click( screen.getByRole( 'button', { name: 'Switch to the Like block' } ) );

		await waitFor( () => expect( screen.getAllByRole( 'checkbox' ) ).toHaveLength( 2 ) );
		screen
			.getAllByRole( 'checkbox' )
			.forEach( checkbox => expect( checkbox ).toHaveAttribute( 'aria-disabled', 'true' ) );
		expect( screen.queryByRole( 'link', { name: 'Open Site Editor' } ) ).not.toBeInTheDocument();

		settings.resolve( { ...baseSettings, likes_auto_add: [] } );
		await waitFor( () =>
			expect( card( 'Before the content' ) ).not.toHaveAttribute( 'aria-disabled', 'true' )
		);
		expect( screen.queryByRole( 'link', { name: 'Open Site Editor' } ) ).not.toBeInTheDocument();
	} );
} );

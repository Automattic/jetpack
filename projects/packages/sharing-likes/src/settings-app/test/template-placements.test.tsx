import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { TemplatePlacements } from '../components/template-placements';
import { LikeButtonsSection } from '../sections/like-buttons-section';
import { apiCalls, baseSettings, baseStatus, renderWithData, setScriptData } from './helpers';
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
	setScriptData();
} );

afterEach( () => {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

describe( 'TemplatePlacements', () => {
	it.each( [
		[ 'sharing', [ 'after_content' ], 'Before the content', [ 'before_content' ] ],
		[ 'sharing', [ 'after_content' ], 'After the content', [] ],
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

	// The link opens the template, which only has the block once the save lands.
	it( 'only links a ticked card once its save lands', async () => {
		const user = userEvent.setup();
		const save = deferred< Settings >();
		mockApiFetch.mockImplementation( ( { method } ) =>
			method === 'PUT' ? save.promise : Promise.resolve( baseStatus )
		);
		renderCards( 'sharing', [ 'after_content' ] );

		expect( cardsWithPreview() ).toEqual( [ 'After the content' ] );
		await user.click( card( 'Before the content' ) );

		expect( card( 'Before the content' ) ).toHaveAttribute( 'aria-checked', 'true' );
		expect( cardsWithPreview() ).toEqual( [] );
		save.resolve( { ...baseSettings, sharing_buttons_auto_add: [ 'before_content' ] } );
		await waitFor( () => expect( cardsWithPreview() ).toEqual( [ 'Before the content' ] ) );
		expect( screen.getByRole( 'link', { name: 'Preview and edit' } ) ).toHaveAttribute(
			'href',
			baseStatus.site_editor_url
		);
	} );

	it.each( [ PAGE_TEMPLATE_URL, '' ] )(
		'links the page template only with a URL, keeping the notes: "%s"',
		url => {
			renderCards( 'sharing', [], { page_template_editor_url: url } );

			// By text: an anchor with an empty href has no link role, so a role query would pass on a broken link.
			expect( screen.queryByText( 'Edit the page template' )?.getAttribute( 'href' ) ).toBe(
				url || undefined
			);
			expect( screen.getByText( /Templates you’ve saved in the Site Editor/ ) ).toBeInTheDocument();
			expect( screen.getByRole( 'group' ) ).toHaveAccessibleDescription(
				'Pick one place: before or after the content.'
			);
		}
	);

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
		const group = screen.getByRole( 'group', { name: 'Add the Like block to posts and pages' } );
		expect( group ).toHaveAttribute( 'aria-busy', 'true' );
		expect( screen.queryByRole( 'link', { name: 'Open Site Editor' } ) ).not.toBeInTheDocument();

		settings.resolve( { ...baseSettings, likes_auto_add: [] } );
		await waitFor( () =>
			expect( card( 'Before the content' ) ).not.toHaveAttribute( 'aria-disabled', 'true' )
		);
		expect( group ).toHaveAttribute( 'aria-busy', 'false' );
	} );
} );

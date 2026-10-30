import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { TemplatePlacements } from '../components/template-placements';
import { LikeButtonsSection } from '../sections/like-buttons-section';
import { apiCalls, baseSettings, baseStatus, renderWithData, setScriptData } from './helpers';
import type { Feature, PlacementTemplate, Settings, Status, TemplatePlacement } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const PAGE_TEMPLATE_URL = 'https://example.com/wp-admin/site-editor.php?p=page';

const KEYS = { sharing: 'sharing_buttons_auto_add', likes: 'likes_auto_add' } as const;

const NONE = 'Don’t add it automatically';
const BEFORE = 'Before the content';
const AFTER = 'After the content';

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
 * Render the cards for a feature whose block some saved templates manage.
 *
 * @param feature - Feature.
 * @param managed - Templates managing the block.
 * @param pageUrl - Page template URL, empty when the theme has none.
 * @return Render result.
 */
function renderManaged( feature: Feature, managed: PlacementTemplate[], pageUrl: string ) {
	return renderCards( feature, [ 'after_content' ], {
		page_template_editor_url: pageUrl,
		[ feature ]: {
			...baseStatus[ feature ],
			state: 'block_call_to_action',
			managed_templates: managed,
		},
	} );
}

/**
 * Where the "Edit the … template" links go, post template first.
 *
 * @return URLs.
 */
function templateLinks(): ( string | null )[] {
	return [ 'post', 'page' ]
		.map( name => screen.queryByRole( 'link', { name: `Edit the ${ name } template` } ) )
		.filter( link => link !== null )
		.map( link => link.getAttribute( 'href' ) );
}

/**
 * A placement's radio.
 *
 * @param name - Card title, or the label of the option that adds nothing.
 * @return Radio.
 */
function radio( name: string ) {
	return screen.getByRole( 'radio', { name } );
}

/**
 * The label of the radio that is checked.
 *
 * @return Label.
 */
function checkedRadio(): string | undefined {
	return [ NONE, BEFORE, AFTER ].find(
		name => radio( name ).getAttribute( 'aria-checked' ) === 'true'
	);
}

/**
 * The "Preview and edit" links, by the card title they sit under.
 *
 * @return Titles of the cards showing a link.
 */
function cardsWithPreview(): string[] {
	return [ BEFORE, AFTER ].filter( title =>
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
		[ 'sharing', [], NONE, BEFORE, [ 'before_content' ] ],
		[ 'sharing', [ 'before_content' ], BEFORE, AFTER, [ 'after_content' ] ],
		[ 'likes', [ 'after_content' ], AFTER, NONE, [] ],
	] as [ Feature, TemplatePlacement[], string, string, TemplatePlacement[] ][] )(
		'%s: from %j ("%s"), picking "%s" saves %j',
		async ( feature, stored, checkedFirst, clicked, sent ) => {
			const user = userEvent.setup();
			mockApiFetch.mockImplementation( ( { data } ) =>
				Promise.resolve( { ...baseSettings, ...( data as Settings ) } )
			);
			renderCards( feature, stored );
			expect( checkedRadio() ).toBe( checkedFirst );

			await user.click( radio( clicked ) );

			expect( apiCalls( 'PUT' ) ).toEqual( [
				{
					path: '/wpcom/v2/sharing-likes/settings',
					method: 'PUT',
					data: { [ KEYS[ feature ] ]: sent },
				},
			] );
			expect( checkedRadio() ).toBe( clicked );
		}
	);

	it( 'only links a ticked card once its save lands', async () => {
		const user = userEvent.setup();
		const save = deferred< Settings >();
		mockApiFetch.mockImplementation( ( { method } ) =>
			method === 'PUT' ? save.promise : Promise.resolve( baseStatus )
		);
		renderCards( 'sharing', [ 'after_content' ] );

		expect( cardsWithPreview() ).toEqual( [ AFTER ] );
		await user.click( radio( BEFORE ) );

		expect( checkedRadio() ).toBe( BEFORE );
		expect( radio( AFTER ) ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect( cardsWithPreview() ).toEqual( [] );
		save.resolve( { ...baseSettings, sharing_buttons_auto_add: [ 'before_content' ] } );
		await waitFor( () => expect( cardsWithPreview() ).toEqual( [ BEFORE ] ) );
		expect( screen.getByRole( 'link', { name: 'Preview and edit' } ) ).toHaveAttribute(
			'href',
			baseStatus.site_editor_url
		);
	} );

	it.each( [ PAGE_TEMPLATE_URL, '' ] )( 'links the page template only with a URL: "%s"', url => {
		renderCards( 'sharing', [], { page_template_editor_url: url } );

		// By text: an anchor with an empty href has no link role, so a role query would pass on a broken link.
		expect( screen.queryByText( 'Edit the page template' )?.getAttribute( 'href' ) ).toBe(
			url || undefined
		);
		expect(
			screen.queryByRole( 'link', { name: 'Edit the post template' } )
		).not.toBeInTheDocument();
	} );

	it.each( [
		[
			'sharing',
			[ 'single' ],
			PAGE_TEMPLATE_URL,
			'Your post template was saved in the Site Editor, so these choices no longer change it. Add, move or remove the Sharing Buttons block there.',
			PAGE_TEMPLATE_URL,
		],
		[
			'likes',
			[ 'page' ],
			PAGE_TEMPLATE_URL,
			'Your page template was saved in the Site Editor, so these choices no longer change it. Add, move or remove the Like block there.',
			baseStatus.site_editor_url,
		],
		[
			'sharing',
			[ 'single', 'page' ],
			PAGE_TEMPLATE_URL,
			'Your post and page templates were saved in the Site Editor, so these choices no longer change them. Add, move or remove the Sharing Buttons block there.',
			'',
		],
		[
			'likes',
			[ 'single' ],
			'',
			'Your post template was saved in the Site Editor, so these choices no longer change it. Add, move or remove the Like block there.',
			'',
		],
	] as [ Feature, PlacementTemplate[], string, string, string ][] )(
		'%s managed by %j, page template "%s": a notice above the cards',
		( feature, managed, pageUrl, notice, previewUrl ) => {
			renderManaged( feature, managed, pageUrl );

			expect( screen.getByText( notice ) ).toBeInTheDocument();
			expect( templateLinks() ).toEqual(
				managed.map( template => ( template === 'single' ? baseStatus.site_editor_url : pageUrl ) )
			);
			// Other templates, such as `singular` or a custom one, still follow the choice.
			expect( screen.getAllByRole( 'radio' ) ).toHaveLength( 3 );
			expect( screen.queryByText( 'Preview and edit' )?.getAttribute( 'href' ) ?? '' ).toBe(
				previewUrl
			);
			expect( screen.queryByText( /Want pages to look different/ ) ).not.toBeInTheDocument();
		}
	);

	it( 'shows no notice and previews the post template while neither template manages the block', () => {
		renderCards( 'likes', [ 'after_content' ], { page_template_editor_url: PAGE_TEMPLATE_URL } );

		expect(
			screen.getByRole( 'radiogroup', {
				name: 'Where should the Like block go on posts and pages?',
			} )
		).toBeInTheDocument();
		expect( screen.queryByText( /no longer change/ ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Preview and edit' } ) ).toHaveAttribute(
			'href',
			baseStatus.site_editor_url
		);
	} );

	it( 'shows the cards disabled, not the Site Editor button, while settings catch up with a switch', async () => {
		const user = userEvent.setup();
		const settings = deferred< Settings >();
		mockApiFetch.mockImplementation( ( { path, method } ) => {
			if ( method === 'POST' ) {
				return Promise.resolve( {
					...baseStatus,
					likes: { ...baseStatus.likes, state: 'block_call_to_action', supported: true },
				} );
			}
			return path?.endsWith( '/settings' ) ? settings.promise : Promise.resolve( baseStatus );
		} );
		renderWithData( <LikeButtonsSection />, {
			status: {
				...baseStatus,
				likes: { ...baseStatus.likes, state: 'configure_with_block_nudge', supported: true },
			},
		} );

		await user.click( screen.getByRole( 'button', { name: 'Switch to the Like block' } ) );

		await waitFor( () => expect( screen.getAllByRole( 'radio' ) ).toHaveLength( 3 ) );
		screen
			.getAllByRole( 'radio' )
			.forEach( option => expect( option ).toHaveAttribute( 'aria-disabled', 'true' ) );
		const group = screen.getByRole( 'radiogroup', {
			name: 'Where should the Like block go on posts and pages?',
		} );
		expect( group ).toHaveAttribute( 'aria-busy', 'true' );
		expect( screen.queryByRole( 'link', { name: 'Open Site Editor' } ) ).not.toBeInTheDocument();

		settings.resolve( { ...baseSettings, likes_auto_add: [] } );
		await waitFor( () => expect( radio( BEFORE ) ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
		expect( group ).toHaveAttribute( 'aria-busy', 'false' );
	} );
} );

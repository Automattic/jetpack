import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { RelatedPostsSettings } from '../related-posts';
import type { MyJetpackModule } from '../../../types';

const mockFetchModules = jest.fn();
const mockCreateErrorNotice = jest.fn();
let mockIsBlockTheme = false;

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		fetchModules: mockFetchModules,
		createErrorNotice: mockCreateErrorNotice,
	} ),
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
	getScriptData: () => ( { myJetpack: { siteEditor: { isBlockTheme: mockIsBlockTheme } } } ),
} ) );
jest.mock( '../../module-toggle', () => ( {
	ModuleToggle: ( { labelledby }: { labelledby?: string } ) => (
		<input type="checkbox" aria-labelledby={ labelledby } />
	),
} ) );

const build = ( overrides: Partial< MyJetpackModule > = {} ) =>
	( {
		module: 'related-posts',
		name: 'Related Posts',
		activated: true,
		override: false,
		options: {
			show_headline: { current_value: true },
			show_thumbnails: { current_value: false },
		},
		...overrides,
	} ) as unknown as MyJetpackModule;

beforeEach( () => {
	jest.clearAllMocks();
	mockIsBlockTheme = false;
	( apiFetch as unknown as jest.Mock ).mockResolvedValue( {} );
} );

describe( 'RelatedPostsSettings', () => {
	it( 'names the module switch by the visible text', () => {
		render( <RelatedPostsSettings module={ build() } /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'Show related content after posts' } )
		).toBeInTheDocument();
	} );

	it( 'shows the stored values of both options', () => {
		render( <RelatedPostsSettings module={ build() } /> );

		expect( screen.getByRole( 'switch', { name: /heading/ } ) ).toBeChecked();
		expect( screen.getByRole( 'switch', { name: /thumbnail/ } ) ).not.toBeChecked();
	} );

	it( 'saves a changed option to the settings endpoint, then refetches the modules', async () => {
		render( <RelatedPostsSettings module={ build() } /> );
		await userEvent.click( screen.getByRole( 'switch', { name: /thumbnail/ } ) );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/settings',
			method: 'POST',
			data: { show_thumbnails: true },
		} );
		await waitFor( () => expect( mockFetchModules ).toHaveBeenCalledTimes( 1 ) );
	} );

	it( 'says so when the save fails, and shows the stored value again', async () => {
		( apiFetch as unknown as jest.Mock ).mockRejectedValue( new Error( 'nope' ) );
		render( <RelatedPostsSettings module={ build() } /> );
		await userEvent.click( screen.getByRole( 'switch', { name: /thumbnail/ } ) );

		await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( screen.getByRole( 'switch', { name: /thumbnail/ } ) ).not.toBeChecked();
		expect( mockFetchModules ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'the module is off', { activated: false } ],
		[ 'the module is forced', { override: 'active' as const } ],
	] )( 'locks both options when %s', ( _name, overrides ) => {
		render( <RelatedPostsSettings module={ build( overrides ) } /> );

		expect( screen.getByRole( 'switch', { name: /heading/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'switch', { name: /thumbnail/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'reads a module with no options as off', () => {
		render( <RelatedPostsSettings module={ build( { options: [] } ) } /> );

		expect( screen.getByRole( 'switch', { name: /heading/ } ) ).not.toBeChecked();
	} );

	it.each( [
		[ true, false, 'Related', 0 ],
		[ false, true, null, 3 ],
	] )(
		'previews the stored options: headline %s, thumbnails %s',
		( headline, thumbnails, headlineText, images ) => {
			const options = {
				show_headline: { current_value: headline },
				show_thumbnails: { current_value: thumbnails },
			};
			render( <RelatedPostsSettings module={ build( { options } as never ) } /> );
			const preview = screen.getByRole( 'group', { name: 'Preview' } );

			expect( within( preview ).getAllByRole( 'listitem' ) ).toHaveLength( 3 );
			expect( within( preview ).queryByText( 'Related' ) ).toBe(
				headlineText ? within( preview ).getByText( headlineText ) : null
			);
			expect( within( preview ).queryAllByRole( 'presentation' ) ).toHaveLength( images );
		}
	);

	it( 'follows an option while its save is still running', async () => {
		( apiFetch as unknown as jest.Mock ).mockReturnValue( new Promise( () => undefined ) );
		render( <RelatedPostsSettings module={ build() } /> );
		await userEvent.click( screen.getByRole( 'switch', { name: /thumbnail/ } ) );

		expect(
			within( screen.getByRole( 'group', { name: 'Preview' } ) ).queryAllByRole( 'presentation' )
		).toHaveLength( 3 );
	} );

	it( 'leaves out the preview while the module is off', () => {
		render( <RelatedPostsSettings module={ build( { activated: false } ) } /> );

		expect( screen.queryByRole( 'group', { name: 'Preview' } ) ).not.toBeInTheDocument();
	} );

	it( 'links to the Customizer on a classic theme, coming back to this page', () => {
		render( <RelatedPostsSettings module={ build() } /> );
		const href = screen
			.getByRole( 'link', { name: 'Configure related posts in the Customizer' } )
			.getAttribute( 'href' ) as string;
		const url = new URL( href );

		expect( url.pathname ).toBe( '/wp-admin/customize.php' );
		expect( url.searchParams.get( 'autofocus[section]' ) ).toBe( 'jetpack_relatedposts' );
		expect( url.searchParams.get( 'return' ) ).toBe( window.location.href );
	} );

	it( 'points a block theme to the site editor docs instead', () => {
		mockIsBlockTheme = true;
		render( <RelatedPostsSettings module={ build() } /> );

		expect( screen.getByRole( 'link', { name: /site editor/ } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Customizer/ } ) ).not.toBeInTheDocument();
	} );

	it( 'leaves out the appearance link while the module is off', () => {
		render( <RelatedPostsSettings module={ build( { activated: false } ) } /> );

		expect( screen.queryByRole( 'link', { name: /Customizer/ } ) ).not.toBeInTheDocument();
	} );
} );

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { RelatedPostsSettings } from '../related-posts';
import type { MyJetpackModule } from '../../../types';

const mockFetchModules = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockCreateSuccessNotice = jest.fn();
let mockIsBlockTheme = false;

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		fetchModules: mockFetchModules,
		createErrorNotice: mockCreateErrorNotice,
		createSuccessNotice: mockCreateSuccessNotice,
	} ),
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
	getScriptData: () => ( { myJetpack: { siteEditor: { isBlockTheme: mockIsBlockTheme } } } ),
} ) );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );
jest.mock( '../../module-toggle', () => ( {
	ModuleToggle: ( { labelledby, disabled }: { labelledby?: string; disabled?: boolean } ) => (
		<input type="checkbox" aria-labelledby={ labelledby } disabled={ disabled } />
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
		render( <RelatedPostsSettings module={ build() } disabled={ false } /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'Show related content after posts' } )
		).toBeInTheDocument();
	} );

	it( 'shows the stored values of both options', () => {
		render( <RelatedPostsSettings module={ build() } disabled={ false } /> );

		expect( screen.getByRole( 'switch', { name: /heading/ } ) ).toBeChecked();
		expect( screen.getByRole( 'switch', { name: /thumbnail/ } ) ).not.toBeChecked();
	} );

	it( 'saves a changed option to the settings endpoint, then refetches the modules', async () => {
		render( <RelatedPostsSettings module={ build() } disabled={ false } /> );
		await userEvent.click( screen.getByRole( 'switch', { name: /thumbnail/ } ) );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/settings',
			method: 'POST',
			data: { show_thumbnails: true },
		} );
		await waitFor( () => expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockFetchModules ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'says so when the save fails, and shows the stored value again', async () => {
		( apiFetch as unknown as jest.Mock ).mockRejectedValue( new Error( 'nope' ) );
		render( <RelatedPostsSettings module={ build() } disabled={ false } /> );
		await userEvent.click( screen.getByRole( 'switch', { name: /thumbnail/ } ) );

		await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( screen.getByRole( 'switch', { name: /thumbnail/ } ) ).not.toBeChecked();
		expect( mockFetchModules ).not.toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'the module is off', { activated: false }, false ],
		[ 'the site cannot use it', {}, true ],
	] )( 'locks both options when %s', ( _name, overrides, disabled ) => {
		render( <RelatedPostsSettings module={ build( overrides ) } disabled={ disabled } /> );

		expect( screen.getByRole( 'switch', { name: /heading/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'switch', { name: /thumbnail/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'keeps the options editable when the host forces the module on', () => {
		render(
			<RelatedPostsSettings module={ build( { override: 'active' } ) } disabled={ false } />
		);

		expect( screen.getByRole( 'switch', { name: /heading/ } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'locks the module switch when the site cannot use it', () => {
		render( <RelatedPostsSettings module={ build() } disabled /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'Show related content after posts' } )
		).toBeDisabled();
	} );

	it( 'reads a module with no options as off', () => {
		render( <RelatedPostsSettings module={ build( { options: [] } ) } disabled={ false } /> );

		expect( screen.getByRole( 'switch', { name: /heading/ } ) ).not.toBeChecked();
	} );

	it.each( [
		[ true, false, 0 ],
		[ false, true, 3 ],
	] )(
		'previews the stored options: headline %s, thumbnails %s',
		( headline, thumbnails, images ) => {
			const options = {
				show_headline: { current_value: headline },
				show_thumbnails: { current_value: thumbnails },
			};
			render(
				<RelatedPostsSettings module={ build( { options } as never ) } disabled={ false } />
			);
			const preview = screen.getByRole( 'group', { name: 'Preview' } );

			expect( within( preview ).getAllByRole( 'listitem' ) ).toHaveLength( 3 );
			expect( !! within( preview ).queryByText( 'Related' ) ).toBe( headline );
			expect( within( preview ).queryAllByRole( 'presentation' ) ).toHaveLength( images );
		}
	);

	it( 'follows an option while its save is still running', async () => {
		( apiFetch as unknown as jest.Mock ).mockReturnValue( new Promise( () => undefined ) );
		render( <RelatedPostsSettings module={ build() } disabled={ false } /> );
		await userEvent.click( screen.getByRole( 'switch', { name: /thumbnail/ } ) );

		expect(
			within( screen.getByRole( 'group', { name: 'Preview' } ) ).queryAllByRole( 'presentation' )
		).toHaveLength( 3 );
	} );

	it( 'leaves out the preview while the module is off', () => {
		render( <RelatedPostsSettings module={ build( { activated: false } ) } disabled={ false } /> );

		expect( screen.queryByRole( 'group', { name: 'Preview' } ) ).not.toBeInTheDocument();
	} );

	it( 'links to the Customizer on a classic theme, coming back to this page', () => {
		render( <RelatedPostsSettings module={ build() } disabled={ false } /> );
		const href = screen
			.getByRole( 'link', { name: 'Configure related posts in the Customizer' } )
			.getAttribute( 'href' ) as string;
		const url = new URL( href );

		expect( url.pathname ).toBe( '/wp-admin/customize.php' );
		expect( url.searchParams.get( 'autofocus[section]' ) ).toBe( 'jetpack_relatedposts' );
		expect( url.searchParams.get( 'return' ) ).toBe( window.location.href );
		expect( url.searchParams.has( 'url' ) ).toBe( false );
	} );

	it( 'opens the Customizer on the latest post, where its controls show', async () => {
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( [
			{ link: 'https://example.com/hello/' },
		] );
		render( <RelatedPostsSettings module={ build() } disabled={ false } /> );
		const link = screen.getByRole( 'link', { name: 'Configure related posts in the Customizer' } );

		await waitFor( () =>
			expect( new URL( link.getAttribute( 'href' ) as string ).searchParams.get( 'url' ) ).toBe(
				'https://example.com/hello/'
			)
		);
		expect( apiFetch ).toHaveBeenCalledWith( { path: '/wp/v2/posts?per_page=1&_fields=link' } );
	} );

	it( 'points a block theme to the site editor docs instead', () => {
		mockIsBlockTheme = true;
		render( <RelatedPostsSettings module={ build() } disabled={ false } /> );

		expect( screen.getByRole( 'link', { name: /site editor/ } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Customizer/ } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'the module is off', { activated: false }, false ],
		[ 'the site cannot use it', {}, true ],
	] )( 'leaves out the appearance link while %s', ( _name, overrides, disabled ) => {
		render( <RelatedPostsSettings module={ build( overrides ) } disabled={ disabled } /> );

		expect( screen.queryByRole( 'link', { name: /Customizer/ } ) ).not.toBeInTheDocument();
	} );
} );

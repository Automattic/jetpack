// Site title and tagline are core options, not Jetpack settings, so they take a
// different route from everything else on the Settings page. Two things matter
// here:
//
// 1. the right endpoint and key names per site type — `blogname` /
//    `blogdescription` on the WordPress.com settings endpoint for Simple sites,
//    `title` / `description` on core's own route everywhere else. Sending the
//    wrong pair silently writes nothing.
// 2. entity decoding. WordPress stores both through `sanitize_option()`, so
//    they come back HTML-escaped; without decoding, an ampersand in the title
//    renders as `&amp;` in the field and gets re-escaped on the next save.

const mockApiFetch = jest.fn();
const mockIsSimpleSite = jest.fn< boolean, [] >();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => mockIsSimpleSite(),
	getSiteData: () => ( { wpcom: { blog_id: 123 } } ),
} ) );

jest.mock( '@automattic/jetpack-api', () => ( { __esModule: true, default: {} } ) );

import { fetchSiteIdentity, updateSiteIdentity } from '../src/settings/api';

describe( 'site identity API', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockIsSimpleSite.mockReturnValue( false );
	} );

	describe( 'on a Jetpack or Atomic site', () => {
		it( 'reads core settings, which name the fields title and description', async () => {
			mockApiFetch.mockResolvedValue( { title: 'Octagonal', description: 'One a week.' } );

			await expect( fetchSiteIdentity() ).resolves.toEqual( {
				title: 'Octagonal',
				description: 'One a week.',
			} );
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: '/wp/v2/settings' } )
			);
		} );

		it( 'writes only the fields that changed', async () => {
			mockApiFetch.mockResolvedValue( { title: 'New', description: 'Old' } );

			await updateSiteIdentity( { title: 'New' } );

			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/wp/v2/settings',
					method: 'POST',
					data: { title: 'New' },
				} )
			);
		} );
	} );

	describe( 'on a Simple site', () => {
		beforeEach( () => mockIsSimpleSite.mockReturnValue( true ) );

		it( 'reads the WordPress.com endpoint, which names the fields blogname and blogdescription', async () => {
			mockApiFetch.mockResolvedValue( {
				settings: { blogname: 'Octagonal', blogdescription: 'One a week.' },
			} );

			await expect( fetchSiteIdentity() ).resolves.toEqual( {
				title: 'Octagonal',
				description: 'One a week.',
			} );
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: '/rest/v1.4/sites/123/settings' } )
			);
		} );

		it( 'writes under the WordPress.com key names', async () => {
			mockApiFetch.mockResolvedValue( { updated: { blogname: 'New' } } );

			await updateSiteIdentity( { title: 'New' } );

			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { method: 'POST', data: { blogname: 'New' } } )
			);
		} );

		it( 'reads the stored pair back after writing, rather than trusting the write', async () => {
			// That endpoint answers with the value it was handed, not the one it
			// stored, and drops a key entirely when sanitizing produced what was
			// already there. So its response is neither canonical nor complete,
			// and the only way to learn what WordPress kept is to read again.
			mockApiFetch
				.mockResolvedValueOnce( { updated: { blogname: 'Whatever it echoed' } } )
				.mockResolvedValueOnce( {
					settings: { blogname: 'What WP stored', blogdescription: 'One a week.' },
				} );

			await expect( updateSiteIdentity( { title: 'New' } ) ).resolves.toEqual( {
				title: 'What WP stored',
				description: 'One a week.',
			} );

			expect( mockApiFetch ).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining( { method: 'POST' } )
			);
			expect( mockApiFetch ).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining( { method: 'GET' } )
			);
		} );

		it( 'accepts a response that omits the `settings` envelope', async () => {
			mockApiFetch.mockResolvedValue( { blogname: 'Bare', blogdescription: 'No envelope.' } );

			await expect( fetchSiteIdentity() ).resolves.toEqual( {
				title: 'Bare',
				description: 'No envelope.',
			} );
		} );
	} );

	describe( 'entity decoding', () => {
		it( 'decodes the escaped values WordPress stores', async () => {
			mockApiFetch.mockResolvedValue( {
				title: 'Ben &amp; Jerry&#039;s',
				description: '&quot;Slow&quot; reviews',
			} );

			await expect( fetchSiteIdentity() ).resolves.toEqual( {
				title: "Ben & Jerry's",
				description: '"Slow" reviews',
			} );
		} );

		it( 'decodes what comes back from a save too, so the field never shows entities', async () => {
			mockApiFetch.mockResolvedValue( { title: 'Ben &amp; Jerry&#039;s', description: '' } );

			await expect( updateSiteIdentity( { title: "Ben & Jerry's" } ) ).resolves.toEqual( {
				title: "Ben & Jerry's",
				description: '',
			} );
		} );

		it( 'treats a missing value as empty rather than "undefined"', async () => {
			mockApiFetch.mockResolvedValue( {} );

			await expect( fetchSiteIdentity() ).resolves.toEqual( { title: '', description: '' } );
		} );
	} );
} );

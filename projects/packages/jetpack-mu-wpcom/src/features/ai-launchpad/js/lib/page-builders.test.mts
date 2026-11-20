import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAboutPage } from './about-page.ts';
import { createContactPage } from './contact-page.ts';
import { createEventsPage } from './events-page.ts';
import { createGalleryPage } from './gallery-page.ts';
import { createPortfolioPiece } from './portfolio-piece.ts';
import { ENGLISH_SITE_COPY } from './site-copy.fixture.mts';
import { createVideoPage } from './video-page.ts';

type PageData = { title: string; content: string; status: string };
type Fetcher = ( options: object ) => Promise< unknown >;
type Build = ( intro: string | undefined, fetcher: Fetcher ) => Promise< unknown >;

/**
 * Stub fetcher that records each request body and returns a created page.
 *
 * @return The stub and its recorded request bodies.
 */
function stubFetcher() {
	const requests: PageData[] = [];
	const fetcher: Fetcher = async options => {
		const { title, content, status } = ( options as { data: PageData } ).data;
		requests.push( { title, content, status } );
		return { id: 42 };
	};
	return { fetcher, requests };
}

const INTRO = 'Made by <us> & friends.';
const INTRO_BLOCK =
	'<!-- wp:paragraph --><p>Made by &lt;us&gt; &amp; friends.</p><!-- /wp:paragraph -->';
const EVENT_ENTRY = `<!-- wp:heading {"level":3,"placeholder":"Event name"} --><h3 class="wp-block-heading"></h3><!-- /wp:heading -->

<!-- wp:paragraph {"placeholder":"Date, time, and place"} --><p></p><!-- /wp:paragraph -->`;

// [ name, build, title, content ]
const INTRO_PAGES: Array< [ string, Build, string, string ] > = [
	[
		'gallery',
		( intro, fetcher ) => createGalleryPage( intro, ENGLISH_SITE_COPY, fetcher ),
		'Gallery',
		`<!-- wp:heading --><h2 class="wp-block-heading">Take a look</h2><!-- /wp:heading -->

${ INTRO_BLOCK }

<!-- wp:gallery --><figure class="wp-block-gallery has-nested-images columns-default is-cropped"></figure><!-- /wp:gallery -->`,
	],
	[
		'events',
		( intro, fetcher ) => createEventsPage( intro, ENGLISH_SITE_COPY, fetcher ),
		'Events',
		`<!-- wp:heading --><h2 class="wp-block-heading">Upcoming events</h2><!-- /wp:heading -->

${ INTRO_BLOCK }

${ EVENT_ENTRY }

${ EVENT_ENTRY }

${ EVENT_ENTRY }`,
	],
	[
		'video',
		( intro, fetcher ) => createVideoPage( intro, ENGLISH_SITE_COPY, fetcher ),
		'Videos',
		`<!-- wp:heading --><h2 class="wp-block-heading">Watch</h2><!-- /wp:heading -->

${ INTRO_BLOCK }

<!-- wp:video --><figure class="wp-block-video"></figure><!-- /wp:video -->`,
	],
	[
		'contact',
		( intro, fetcher ) => createContactPage( intro, ENGLISH_SITE_COPY, fetcher ),
		'Contact',
		`<!-- wp:heading --><h2 class="wp-block-heading">Get in touch</h2><!-- /wp:heading -->

${ INTRO_BLOCK }

<!-- wp:jetpack/contact-form -->
<!-- wp:jetpack/field-name {"label":"Name","required":true} /-->
<!-- wp:jetpack/field-email {"label":"Email","required":true} /-->
<!-- wp:jetpack/field-textarea {"label":"Message"} /-->
<!-- /wp:jetpack/contact-form -->`,
	],
];

const PAGES: Array< [ string, Build, string, string ] > = [
	...INTRO_PAGES,
	[
		'portfolio',
		( _intro, fetcher ) => createPortfolioPiece( ENGLISH_SITE_COPY, fetcher ),
		'',
		`<!-- wp:image --><figure class="wp-block-image"><img alt=""/></figure><!-- /wp:image -->

<!-- wp:paragraph {"placeholder":"What this project was, who it was for, and what you did."} --><p></p><!-- /wp:paragraph -->`,
	],
	[
		'about',
		( intro, fetcher ) =>
			createAboutPage(
				{ title: 'About Alpine Notes', paragraphs: [ 'Who we are.', intro ?? '' ] },
				ENGLISH_SITE_COPY,
				fetcher
			),
		'About Alpine Notes',
		`<!-- wp:paragraph --><p>Who we are.</p><!-- /wp:paragraph -->

${ INTRO_BLOCK }`,
	],
	[
		'about, for an output that predates the draft',
		( _intro, fetcher ) => createAboutPage( undefined, ENGLISH_SITE_COPY, fetcher ),
		'About',
		'',
	],
];

describe( 'page builders', () => {
	for ( const [ name, build, title, content ] of PAGES ) {
		it( `${ name }: creates one draft page with the exact markup`, async () => {
			const { fetcher, requests } = stubFetcher();
			const result = await build( INTRO, fetcher );

			assert.deepEqual( result, {
				page_id: 42,
				edit_url: '/wp-admin/post.php?post=42&action=edit',
			} );
			assert.deepEqual( requests, [ { title, content, status: 'draft' } ] );
		} );
	}

	it( 'contact: takes the title, heading and field labels from the site copy, escaped', async () => {
		const { fetcher, requests } = stubFetcher();
		await createContactPage(
			undefined,
			{
				contact_page_title: 'Contatti',
				contact_page_heading: 'Scrivici <subito> & presto',
				contact_form_name_label: 'Nome "completo"',
				contact_form_email_label: 'Posta',
				contact_form_message_label: 'Messaggio -- breve',
			},
			fetcher
		);

		assert.equal( requests[ 0 ].title, 'Contatti' );
		assert.equal(
			requests[ 0 ].content,
			`<!-- wp:heading --><h2 class="wp-block-heading">Scrivici &lt;subito&gt; &amp; presto</h2><!-- /wp:heading -->

<!-- wp:jetpack/contact-form -->
<!-- wp:jetpack/field-name {"label":"Nome \\u0022completo\\u0022","required":true} /-->
<!-- wp:jetpack/field-email {"label":"Posta","required":true} /-->
<!-- wp:jetpack/field-textarea {"label":"Messaggio \\u002d\\u002d breve"} /-->
<!-- /wp:jetpack/contact-form -->`
		);
	} );

	it( 'leaves out the intro paragraph when the output carries no intro', async () => {
		for ( const [ name, build, , content ] of INTRO_PAGES ) {
			for ( const intro of [ undefined, '', '   ' ] ) {
				const { fetcher, requests } = stubFetcher();
				await build( intro, fetcher );

				assert.equal( requests[ 0 ].content, content.replace( INTRO_BLOCK + '\n\n', '' ), name );
			}
		}
	} );
} );

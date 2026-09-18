import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createContactPage } from './contact-page.ts';
import { ENGLISH_SITE_COPY } from './site-copy.fixture.mts';

type PageData = { title: string; content: string; status: string; meta: object };
type PageRequest = { path: string; method: string; data: PageData };

/**
 * Stub fetcher that records the request and returns a created page.
 *
 * @return The stub and its recorded requests.
 */
function stubFetcher() {
	const requests: PageRequest[] = [];
	const fetcher = async ( options: object ) => {
		requests.push( options as PageRequest );
		return { id: 42 };
	};
	return { fetcher, requests };
}

describe( 'createContactPage', () => {
	it( 'creates a marked draft page whose content is a heading, the AI intro, and a contact form', async () => {
		const { fetcher, requests } = stubFetcher();
		const result = await createContactPage(
			'Commission a piece, or ask about a wholesale order.',
			ENGLISH_SITE_COPY,
			fetcher
		);

		assert.deepEqual( result, { page_id: 42, edit_url: '/wp-admin/post.php?post=42&action=edit' } );
		const request = requests[ 0 ];
		assert.equal( request.path, '/wp/v2/pages' );
		assert.equal( request.method, 'POST' );
		assert.equal( request.data.title, 'Contact' );
		assert.equal( request.data.status, 'draft' );
		assert.deepEqual( request.data.meta, { _wpcom_ai_launchpad_contact_page: true } );

		// Pinned whole, because the value of this task is the exact markup: the form is the payload and
		// the only variable part is the one AI-written line. A structural change shows up here first.
		assert.equal(
			request.data.content,
			`<!-- wp:heading --><h2 class="wp-block-heading">Get in touch</h2><!-- /wp:heading -->

<!-- wp:paragraph --><p>Commission a piece, or ask about a wholesale order.</p><!-- /wp:paragraph -->

<!-- wp:jetpack/contact-form -->
<!-- wp:jetpack/field-name {"label":"Name","required":true} /-->
<!-- wp:jetpack/field-email {"label":"Email","required":true} /-->
<!-- wp:jetpack/field-textarea {"label":"Message"} /-->
<!-- /wp:jetpack/contact-form -->`
		);
	} );

	it( 'writes the title, heading and form labels from the site-language copy, escaped', async () => {
		// Translations are data too: a quote or a comment closer in one must not break the block
		// delimiter it lands in, and the heading must not become markup.
		const { fetcher, requests } = stubFetcher();
		await createContactPage(
			undefined,
			{
				contact_page_title: 'Contatti',
				contact_page_heading: 'Scrivici <subito> & presto',
				contact_form_name_label: 'Nome "completo"',
				contact_form_email_label: 'E-mail',
				contact_form_message_label: 'Messaggio -- breve',
			},
			fetcher
		);

		const request = requests[ 0 ];
		assert.equal( request.data.title, 'Contatti' );
		assert.ok(
			request.data.content.includes(
				'<h2 class="wp-block-heading">Scrivici &lt;subito&gt; &amp; presto</h2>'
			)
		);
		assert.ok(
			request.data.content.includes( '{"label":"Nome \\u0022completo\\u0022","required":true}' )
		);
		assert.ok( request.data.content.includes( '{"label":"E-mail","required":true}' ) );
		assert.ok( request.data.content.includes( '{"label":"Messaggio \\u002d\\u002d breve"}' ) );
		assert.ok( ! request.data.content.includes( '-->' + ' breve' ) );
	} );

	it( 'escapes the AI-written intro rather than emitting it as markup', async () => {
		const { fetcher, requests } = stubFetcher();
		await createContactPage( 'Ask about <bespoke> orders & timings.', ENGLISH_SITE_COPY, fetcher );

		assert.match(
			requests[ 0 ].data.content,
			/<p>Ask about &lt;bespoke&gt; orders &amp; timings\.<\/p>/
		);
		assert.ok( ! requests[ 0 ].data.content.includes( '<bespoke>' ) );
	} );

	it( 'still creates a usable page when the output carries no intro', async () => {
		// Outputs persisted before page_intros existed, and any run where the model omits the key.
		// The form is what the task is for, so the page must arrive with it either way.
		for ( const intro of [ undefined, '', '   ' ] ) {
			const { fetcher, requests } = stubFetcher();
			await createContactPage( intro, ENGLISH_SITE_COPY, fetcher );

			const content = requests[ 0 ].data.content;
			assert.ok( content.includes( '<!-- wp:jetpack/contact-form -->' ), 'the form must survive' );
			assert.ok( content.includes( 'wp-block-heading' ), 'the heading must survive' );
			assert.ok( ! content.includes( '<!-- wp:paragraph -->' ), 'no empty paragraph block' );
		}
	} );

	it( 'invents no contact details of its own', async () => {
		// The reason this page is hand-authored rather than built from a pattern: the pattern that would
		// have been picked carries a hardcoded address, phone number, and map pin. A confident wrong
		// detail on a real business's contact page is worse than none, so the form is the only channel.
		const { fetcher, requests } = stubFetcher();
		await createContactPage( undefined, ENGLISH_SITE_COPY, fetcher );

		const content = requests[ 0 ].data.content;
		assert.ok( ! /\d{3}[\s.-]?\d{3,4}/.test( content ), 'no phone-shaped digits' );
		assert.ok( ! content.includes( '@' ), 'no email address' );
		assert.ok( ! /wp:(core\/)?map|address|latitude/i.test( content ), 'no map or address block' );
	} );
} );

/**
 * Galleries keep their saved markup valid when the site's Photon-domain setting changes.
 *
 * The block bakes photonized image URLs into its save() output, so flipping the setting changes what
 * save() emits. Content saved under the old behaviour has to keep parsing as a valid block via the
 * deprecation that reproduces it, instead of showing "Block contains unexpected or invalid content".
 */
import {
	createBlock,
	getSaveContent,
	parse,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import metadata from '../block.json';
import deprecated from '../deprecated';
import * as photonDomainDeprecation from '../deprecated/v9';
import save from '../save';

const IMAGES = [
	{
		id: '5',
		url: 'https://example.com/wp-content/uploads/2026/07/one.png',
		alt: '',
		link: 'https://example.com/one/',
		width: 2000,
		height: 680,
	},
	{
		id: '6',
		url: 'https://example.com/wp-content/uploads/2026/07/two.png',
		alt: '',
		link: 'https://example.com/two/',
		width: 1008,
		height: 1008,
	},
];

/**
 * Set what the site reports for the Photon-domain decision, the way the PHP script data does.
 *
 * @param {boolean} skipPhotonDomain - Whether the external Photon domain should be skipped.
 */
function setSkipPhotonDomain( skipPhotonDomain ) {
	window.JetpackScriptData = { jetpack: { flags: { skipPhotonDomain } } };
}

/**
 * Serialize a gallery the way the editor would save it on this site.
 *
 * @return {string} Block markup.
 */
function saveGallery() {
	return serialize( createBlock( metadata.name, { images: IMAGES, ids: [ 5, 6 ] } ) );
}

describe( 'Tiled Gallery Photon domain changes', () => {
	beforeEach( () => {
		registerBlockType( metadata.name, { ...metadata, save, deprecated } );
	} );

	afterEach( () => {
		unregisterBlockType( metadata.name );
		delete window.JetpackScriptData;
	} );

	it( 'saves images on the external Photon domain by default', () => {
		setSkipPhotonDomain( false );

		expect( saveGallery() ).toContain( 'https://i0.wp.com/example.com/wp-content/uploads' );
	} );

	it( 'saves images on the site host when the site skips the Photon domain', () => {
		setSkipPhotonDomain( true );
		const markup = saveGallery();

		expect( markup ).not.toContain( 'i0.wp.com' );
		expect( markup ).toContain( 'src="https://example.com/wp-content/uploads/2026/07/one.png"' );
	} );

	// The regression this guards: a VIP site's galleries were saved with Photon-domain URLs before the
	// site's setting was honoured, and every one of them was flagged invalid on the next editor load.
	it( 'keeps galleries saved on the Photon domain valid once the site skips it', () => {
		setSkipPhotonDomain( false );
		const markupSavedBefore = saveGallery();

		setSkipPhotonDomain( true );
		const [ block ] = parse( markupSavedBefore );

		expect( block.name ).toBe( metadata.name );
		expect( block.isValid ).toBe( true );
		expect( block.attributes.images ).toHaveLength( 2 );
		// Gutenberg informs when a deprecation matched, so this also pins down *how* it stayed valid.
		expect( console ).toHaveInformed();
	} );

	it( 're-serializes those galleries onto the site host', () => {
		setSkipPhotonDomain( false );
		const markupSavedBefore = saveGallery();

		setSkipPhotonDomain( true );
		const reSerialized = serialize( parse( markupSavedBefore ) );

		expect( reSerialized ).not.toContain( 'i0.wp.com' );
		expect( console ).toHaveInformed();
	} );

	it( 'keeps galleries saved on the site host valid while the site still skips the domain', () => {
		setSkipPhotonDomain( true );
		const [ block ] = parse( saveGallery() );

		expect( block.isValid ).toBe( true );
	} );

	// The deprecation earns its keep by mirroring the current markup exactly, so that galleries saved
	// by this version before the setting was honoured match it. The older v8 deprecation happens to
	// match them too, but only because the validator forgives the stray whitespace node in its
	// wrapper — so keep this in step with save.jsx rather than leaning on that.
	it( 'has a deprecation mirroring the current markup, apart from the image host', () => {
		setSkipPhotonDomain( false );
		const attributes = {
			...createBlock( metadata.name, { images: IMAGES, ids: [ 5, 6 ] } ).attributes,
		};

		expect( getSaveContent( { ...metadata, ...photonDomainDeprecation }, attributes ) ).toBe(
			getSaveContent( { ...metadata, save }, attributes )
		);
	} );
} );

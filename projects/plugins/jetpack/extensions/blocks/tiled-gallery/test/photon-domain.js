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
import { photonDomain, siteHost } from '../deprecated/image-host';
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

// Byte-for-byte copies of what each deprecation must keep emitting: markup already saved in the
// database, one per image host. These are literals on purpose — asserting against
// serialize( createBlock( … ) ) would let the code under test supply its own expected value, and
// `deprecated/image-host/` builds on the live `Layout`, so a change there would move the deprecation
// and this fixture together and silently stop matching what sites actually stored.
const STORED_PHOTON_MARKUP =
	'<div class="wp-block-jetpack-tiled-gallery aligncenter is-style-rectangular"><div class=""><div class="tiled-gallery__gallery">' +
	'<div class="tiled-gallery__row"><div class="tiled-gallery__col"><figure class="tiled-gallery__item"><img alt="" data-height="680" data-id="5" data-link="https://example.com/one/" data-url="https://example.com/wp-content/uploads/2026/07/one.png" data-width="2000" src="https://i0.wp.com/example.com/wp-content/uploads/2026/07/one.png?ssl=1" data-amp-layout="responsive"/></figure></div></div>' +
	'<div class="tiled-gallery__row"><div class="tiled-gallery__col"><figure class="tiled-gallery__item"><img alt="" data-height="1008" data-id="6" data-link="https://example.com/two/" data-url="https://example.com/wp-content/uploads/2026/07/two.png" data-width="1008" src="https://i0.wp.com/example.com/wp-content/uploads/2026/07/two.png?ssl=1" data-amp-layout="responsive"/></figure></div></div></div></div></div>';

const STORED_SITE_HOST_MARKUP =
	'<div class="wp-block-jetpack-tiled-gallery aligncenter is-style-rectangular"><div class=""><div class="tiled-gallery__gallery">' +
	'<div class="tiled-gallery__row"><div class="tiled-gallery__col"><figure class="tiled-gallery__item"><img alt="" data-height="680" data-id="5" data-link="https://example.com/one/" data-url="https://example.com/wp-content/uploads/2026/07/one.png" data-width="2000" src="https://example.com/wp-content/uploads/2026/07/one.png" data-amp-layout="responsive"/></figure></div></div>' +
	'<div class="tiled-gallery__row"><div class="tiled-gallery__col"><figure class="tiled-gallery__item"><img alt="" data-height="1008" data-id="6" data-link="https://example.com/two/" data-url="https://example.com/wp-content/uploads/2026/07/two.png" data-width="1008" src="https://example.com/wp-content/uploads/2026/07/two.png" data-amp-layout="responsive"/></figure></div></div></div></div></div>';

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
		// Gutenberg informs when a deprecation matched, so this also proves it was rescued rather than
		// matching the current save() by accident.
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

	// The mirror image of the case above, reachable by removing a `jetpack_skip_photon_domain` filter
	// or by a site leaving the VIP plan: the markup holds site-host URLs and save() now emits Photon
	// ones.
	it( 'keeps galleries saved on the site host valid once the site stops skipping the domain', () => {
		setSkipPhotonDomain( true );
		const markupSavedBefore = saveGallery();

		setSkipPhotonDomain( false );
		const [ block ] = parse( markupSavedBefore );

		expect( block.isValid ).toBe( true );
		expect( block.attributes.images ).toHaveLength( 2 );
		expect( console ).toHaveInformed();
	} );

	// The load-bearing assertion: each host deprecation must still emit, byte for byte, the markup
	// sites already have in their database. Everything else here compares the code against itself, so
	// this is the only thing that fails if the shared `Layout` changes shape underneath them.
	it( 'reproduces the stored markup for each image host exactly', () => {
		const attributes = createBlock( metadata.name, { images: IMAGES, ids: [ 5, 6 ] } ).attributes;

		setSkipPhotonDomain( true );
		expect( getSaveContent( { ...metadata, ...photonDomain }, attributes ) ).toBe(
			STORED_PHOTON_MARKUP
		);
		expect( getSaveContent( { ...metadata, ...siteHost }, attributes ) ).toBe(
			STORED_SITE_HOST_MARKUP
		);
	} );

	// Only the current version may follow the site's setting. A deprecation that follows it stops
	// reproducing the markup it was saved with, which is what invalidates existing galleries — and it is
	// easy to reintroduce, since some deprecations borrow the current Layout. (For v1–v4 this holds
	// trivially: their photonization never reads the setting. It caught v5, which does.)
	it( 'pins every deprecation to one image host, whatever the site asks for', () => {
		const attributes = createBlock( metadata.name, { images: IMAGES, ids: [ 5, 6 ] } ).attributes;

		deprecated.forEach( ( deprecation, index ) => {
			const blockType = { ...metadata, ...deprecation };

			setSkipPhotonDomain( false );
			const whenPhoton = getSaveContent( blockType, attributes );
			setSkipPhotonDomain( true );
			const whenSkipping = getSaveContent( blockType, attributes );

			expect( { index, markup: whenSkipping } ).toEqual( { index, markup: whenPhoton } );
		} );
	} );

	// Custom links are what make the host deprecations load-bearing rather than redundant: the much
	// older v6 rescues plain galleries by whitespace luck, but knows nothing about `customLink`, so
	// these two cases are the only ones each host entry alone can carry.
	describe( 'galleries with custom links', () => {
		const saveCustomLinkGallery = () =>
			serialize(
				createBlock( metadata.name, {
					images: IMAGES.map( image => ( { ...image, customLink: `${ image.link }custom/` } ) ),
					ids: [ 5, 6 ],
					linkTo: 'custom',
				} )
			);

		it( 'stay valid once the site starts skipping the Photon domain', () => {
			setSkipPhotonDomain( false );
			const markupSavedBefore = saveCustomLinkGallery();

			setSkipPhotonDomain( true );
			const [ block ] = parse( markupSavedBefore );

			expect( block.isValid ).toBe( true );
			expect( block.attributes.images[ 0 ].customLink ).toBe( 'https://example.com/one/custom/' );
			expect( console ).toHaveInformed();
		} );

		it( 'stay valid once the site stops skipping it', () => {
			setSkipPhotonDomain( true );
			const markupSavedBefore = saveCustomLinkGallery();

			setSkipPhotonDomain( false );
			const [ block ] = parse( markupSavedBefore );

			expect( block.isValid ).toBe( true );
			expect( block.attributes.images[ 0 ].customLink ).toBe( 'https://example.com/one/custom/' );
			expect( console ).toHaveInformed();
		} );
	} );
} );

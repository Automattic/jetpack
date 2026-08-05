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

	// Only the current version may follow the site's setting. A deprecation that follows it stops
	// reproducing the markup it was saved with, which is what invalidates existing galleries — and it is
	// easy to reintroduce, since some deprecations borrow the current Layout.
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

	// Galleries using custom links match the deprecation added for this change and nothing else — the
	// much older v6 covers plain galleries by whitespace luck, but knows nothing about custom links.
	// This case is what keeps that deprecation from being deleted as redundant.
	it( 'keeps galleries with custom links valid too', () => {
		setSkipPhotonDomain( false );
		const markupSavedBefore = serialize(
			createBlock( metadata.name, {
				images: IMAGES.map( image => ( { ...image, customLink: `${ image.link }custom/` } ) ),
				ids: [ 5, 6 ],
				linkTo: 'custom',
			} )
		);

		setSkipPhotonDomain( true );
		const [ block ] = parse( markupSavedBefore );

		expect( block.isValid ).toBe( true );
		expect( block.attributes.images[ 0 ].customLink ).toBe( 'https://example.com/one/custom/' );
		expect( console ).toHaveInformed();
	} );
} );

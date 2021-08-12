/* eslint-disable no-undef */

const VALID_GOOGLE_FONTS = [
	'Bodoni Moda',
	'Cabin',
	'Chivo',
	'Courier Prime',
	'EB Garamond',
	'Fira Sans',
	'Josefin Sans',
	'Libre Baskerville',
	'Libre Franklin',
	'Lora',
	'Merriweather',
	'Montserrat',
	'Nunito',
	'Open Sans',
	'Overpass',
	'Playfair Display',
	'Poppins',
	'Raleway',
	'Roboto',
	'Roboto Slab',
	'Rubik',
	'Source Sans Pro',
	'Source Serif Pro',
	'Space Mono',
	'Work Sans',
];

// TODO: Stylesheets not being added properly to editor
function addGoogleFontStylesheet( url ) {
	// Generate stylesheet link tag
	const link = document.createElement( 'link' );
	link.rel = 'stylesheet';
	link.href = url;

	// Add google font import stylesheet to Gutenberg canvas
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
	iframe.contentWindow.document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );
}

const isEditorReadyWithBlocks = async () => {
	return new Promise( ( resolve, reject ) => {
		if ( wp && wp.data && wp.data.select && wp.data.subscribe ) {
			const unsubscribe = wp.data.subscribe( () => {
				const isCleanNewPost = wp.data.select( 'core/editor' ).isCleanNewPost();

				if ( isCleanNewPost ) {
					unsubscribe();
					resolve( false );
				}

				const blocks = wp.data.select( 'core/editor' ).getBlocks();

				if ( blocks.length > 0 ) {
					unsubscribe();
					resolve( true );
				}
			} );
		} else {
			reject( false );
		}
	} );
};

// When a google font is selected in the global styles site editor sidebar, its
// font face declarations and font files will be dynamically imported
( async function () {
	await isEditorReadyWithBlocks();

	// Prevents re-fetching google fonts that have already been requested
	// during the session
	const cache = [];

	// Monitor wp-data for updates to the global styles and selected fontFamily
	wp.data.subscribe( function () {
		const settings = wp.data.select( 'core/edit-site' ).getSettings();
		let globalStylesCSSDeclarations = '';
		if ( settings.styles ) {
			globalStylesCSSDeclarations = settings.styles.reduce( function ( acc, style ) {
				return style.isGlobalStyles && ! style.__experimentalNoWrapper ? style.css : acc;
			}, '' );
		}

		if ( globalStylesCSSDeclarations ) {
			// Retrieve information about selected font family from serialized data
			const fontFamilySlug = globalStylesCSSDeclarations.match(
				/font-family: var\(--wp--preset--font-family--(.*?)(?=\);)/
			);
			const fontFamilyName =
				fontFamilySlug &&
				fontFamilySlug[ 1 ]
					.split( '-' )
					.map( function ( word ) {
						return word[ 0 ].toUpperCase() + word.substring( 1 );
					} )
					.join( ' ' );

			// Fetch google font files for selected font
			if ( VALID_GOOGLE_FONTS.includes( fontFamilyName ) ) {
				if ( ! cache.includes( fontFamilyName ) ) {
					cache.push( fontFamilyName );
					const encodedFontName = fontFamilyName.replace( ' ', '+' );
					addGoogleFontStylesheet(
						`https://fonts.googleapis.com/css?family=${ encodedFontName }:regular,bold,italic,bolditalic|`
					);
				}
			}
		}
	} );
} )();

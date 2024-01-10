const fs = require( 'fs' );
const path = require( 'path' );

// URL to fetch CSS from
const url = 'https://widgets.wp.com/likes/style.css';

// Function to pretty print CSS
function prettyPrintCSS( css ) {
	// Adding a line break after each semicolon and opening brace
	css = css.replace( /;/g, ';\n  ' ).replace( /\{/g, ' {\n  ' );

	// Adding a line break before/after each closing brace
	css = css.replace( /\}/g, '\n}\n' );

	// Removing extra spaces and line breaks for correct indentation
	css = css.replace( /\n\s*\n/g, '\n' );

	return css;
}

// Function to process CSS
function processCSS( css ) {
	// Remove body and HTML styles
	let processedCSS = css.replace( /body[^{]*\{[^}]*\}/g, '' );
	processedCSS = processedCSS.replace( /html[^{]*\{[^}]*\}/g, '' );

	// Pretty print the CSS
	processedCSS = prettyPrintCSS( processedCSS );

	// Custom rule to add
	const customRule = `
.wp-block-jetpack-like {
    &__learn-more {
        padding: 0 16px 16px 52px;
        margin-top: -12px;
    }
}`;

	const customRule2 = `
	/* Overrides to fix CSS conflicts within editor. */
.wpl-likebox {
	// Prevents color conflict by
	// .wp-block-post-content a:where(:not(.wp-element-button))
	a {
		color: #2C3338 !important;
		text-decoration: none !important;
	}

	// Prevents focus state conflict by
	// a:where(:not(.wp-element-button)):focus
	a:focus {
		text-decoration: none !important;
	}
}
`;

	// Get current date and time
	const now = new Date();
	const dateAndTime = now.toISOString();

	// Combine and format with a comment
	const finalCSS = `${ customRule.trim() }\n\n/* Fetched below from ${ url } at ${ dateAndTime } */\n${ processedCSS }\n\n${ customRule2.trim() }\n`;

	// Path for the output file in the same directory as the script
	const outputPath = path.join( __dirname, '..', 'editor.scss' );

	// Write to editor.scss in the same directory as the script
	fs.writeFileSync( outputPath, finalCSS );
	// eslint-disable-next-line no-console
	console.log( `CSS processed and saved to ${ outputPath }` );
}

// Fetch and process the CSS
fetch( url )
	.then( response => response.text() )
	.then( processCSS )
	// eslint-disable-next-line no-console
	.catch( err => console.error( 'Error fetching CSS:', err ) );

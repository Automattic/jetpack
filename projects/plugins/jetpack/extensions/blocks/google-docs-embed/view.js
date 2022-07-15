import './view.scss';
import domReady from '@wordpress/dom-ready';

const showError = () => {
	const embeds = document.querySelectorAll( '.wp-block-jetpack-google-docs-embed' );
	//if no embed block then bail
	if ( ! embeds ) {
		return;
	}

	const errorMsg = window.Jetpack_Google_Docs.error_msg;
	if ( ! errorMsg ) {
		return;
	}
	const privateErrorMsg = `<p class="wp-block-jetpack-google-docs-embed__error-msg">${ errorMsg }</p>`;

	//for each embed block select the iframe within
	embeds.forEach( embed => {
		const embedIframe = embed.querySelector( 'iframe' );
		const loader = embed.querySelector( '.loader' );

		//if there isn't an iframe inside then bail
		if ( ! embedIframe ) {
			return;
		}

		// Check if it's presentation block.
		const embedUrlComponents = embedIframe
			.getAttribute( 'src' )
			.match(
				/^(http|https):\/\/(docs\.google.com)\/(spreadsheets|document|presentation)\/d\/([A-Za-z0-9_-]+).*?$/i
			);

		// If it's not the presentation URL, return early with necessary action.
		if (
			null === embedUrlComponents ||
			'undefined' === typeof embedUrlComponents[ 1 ] ||
			'undefined' === typeof embedUrlComponents[ 2 ] ||
			'undefined' === typeof embedUrlComponents[ 3 ]
		) {
			loader.classList.remove( 'is-active' );

			// Remove iframe and show an error msg
			if ( Object.keys( embedIframe.contentWindow ).length === 0 ) {
				embed.innerHTML = privateErrorMsg;
			}

			return;
		}

		const embedUrl = `${ embedUrlComponents[ 1 ] }://${ embedUrlComponents[ 2 ] }/${ embedUrlComponents[ 3 ] }/d/${ embedUrlComponents[ 4 ] }/preview`;

		// Try enbedding Edit URL.
		embedIframe.setAttribute( 'src', embedUrl );

		// Add on load event for the iframe to check it's visibility.
		embedIframe.addEventListener( 'load', function () {
			loader.classList.remove( 'is-active' );

			// When a document is private and the reader doesn't have permission to view it,
			// Google attempts to redirect to a login page on accounts.google.com, which fails.
			// because of that domain's X-FRAME-OPTIONS header. When the embed fails,
			// iFrame's contentWindow attribute is an empty object.
			if ( Object.keys( this.contentWindow ).length === 0 ) {
				// Remove iframe and show an error msg
				embed.innerHTML = privateErrorMsg;
			}
		} );
	} );
};

domReady( () => {
	showError();
} );

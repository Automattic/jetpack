/**
 * Handler function to create an image from the QR code.
 *
 * @param {string} slug      - The slug of the image to create.
 * @param {object} ref       - The ref of the QR code DOM element.
 * @param {boolean} download - Whether to download the image. Defaults to true.
 * @returns {void}           - Nothing when the image is not created.
 */
export function handleDownloadQRCode( slug, ref, download = true ) {
	console.log( 'slug: ', slug );
	if ( ! slug ) {
		return;
	}
	console.log( 'ref: ', ref );

	if ( ! ref?.current ) {
		return;
	}

	const canvasElement = ref.current.querySelector( 'canvas' );
	console.log( 'canvasElement: ', canvasElement );
	if ( ! canvasElement ) {
		return;
	}

	// Convert to canvas element to data URL image.
	canvasElement.toBlob( imageBlob => {
		console.log( 'imageBlob: ', imageBlob );
		const imageURL = URL.createObjectURL( imageBlob );
		const tempLink = document.createElement( 'a' );
		tempLink.href = imageURL;
		// Download, or not.
		tempLink.setAttribute( download ? 'download' : 'target', `qr-post-${ slug }.png` );
		tempLink.click();
	} );
}

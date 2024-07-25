export default function getContainer() {
	// Find the iframe by name attribute
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' ) as HTMLIFrameElement;

	// Get the document inside the iframe
	const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document;

	// Find the container within the iframe or fall back to the main document
	const container =
		( iframeDocument?.body as HTMLBodyElement ) ||
		( document.querySelector( '.edit-post-visual-editor > div' ) as HTMLDivElement );

	// Determine if the element is iframed
	const isIframed = !! iframe;

	return { foundContainer: container, foundIframe: isIframed };
}

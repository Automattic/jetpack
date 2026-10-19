// A module script or one a host inlined has no current script; the host then hands load() an
// assetsUrl, or the chunk requests resolve against the page and the load() promise rejects.
const script = document.currentScript;

if ( script instanceof HTMLScriptElement && script.src ) {
	// @ts-expect-error: __webpack_public_path__ is set globally by webpack, ignore TS2304
	__webpack_public_path__ = script.src.replace( /[?#].*$/, '' ).replace( /[^/]*$/, '' );
}

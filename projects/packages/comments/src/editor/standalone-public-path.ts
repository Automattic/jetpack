// A module script or one a host inlined has no current script; webpack then keeps its own guess
// at the last script tag, and load() takes an assetsUrl.
const script = document.currentScript;

if ( script instanceof HTMLScriptElement && script.src ) {
	// @ts-expect-error: __webpack_public_path__ is set globally by webpack, ignore TS2304
	__webpack_public_path__ = script.src.replace( /[?#].*$/, '' ).replace( /[^/]*$/, '' );
}

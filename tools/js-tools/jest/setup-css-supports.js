// jsdom ships the `CSS` namespace with `escape()` only, and installs it after the
// environment and `setupFiles` have run, so the shim has to live here.
// `@ariakit/react`, which backs every popover in `@wordpress/components`, calls
// `CSS.supports()` and only guards against the namespace itself being absent.
// jsdom applies no stylesheets, so report no support.
if ( globalThis.CSS && ! globalThis.CSS.supports ) {
	globalThis.CSS.supports = () => false;
}

/**
 * Registers all Divi 5 modules with the module library.
 */
import { addAction, didAction } from '@wordpress/hooks';
import { videoPressMetadata, videoPressModule } from './videopress';

const STORE_READY = 'divi.moduleLibrary.registerModuleLibraryStore.after';

let warnTimeout;

/**
 * Registers the VideoPress module once the Divi 5 builder runtime is ready.
 *
 * @return {void}
 */
function register() {
	clearTimeout( warnTimeout );

	const { registerModule } = window?.divi?.moduleLibrary ?? {};

	// The renderers and settings panels consume window.divi.module and
	// window.divi.fieldLibrary at render time. Gate registration on the whole
	// runtime being present so a partially-loaded bundle never renders a
	// half-wired module, which would otherwise surface as an opaque React error.
	if (
		typeof registerModule !== 'function' ||
		! window?.divi?.module ||
		! window?.divi?.fieldLibrary
	) {
		// eslint-disable-next-line no-console
		console.error(
			'Jetpack VideoPress: the Divi 5 builder runtime (window.divi.module / fieldLibrary / moduleLibrary) is unavailable; the VideoPress module was not registered.'
		);
		return;
	}

	registerModule( videoPressMetadata, videoPressModule );
}

/*
 * `@wordpress/hooks` is externalized to Divi's vendored instance (see
 * webpack.config.js), so this listens on the same instance Divi fires the action
 * on. Register immediately if it already fired, otherwise on the action — and
 * warn if it never fires (e.g. Divi renamed the action), which would otherwise
 * be an invisible no-op.
 */
if ( didAction( STORE_READY ) ) {
	register();
} else {
	addAction( STORE_READY, 'jetpack-videopress', register );

	warnTimeout = setTimeout( () => {
		if ( ! didAction( STORE_READY ) ) {
			// eslint-disable-next-line no-console
			console.error(
				`Jetpack VideoPress: Divi never fired "${ STORE_READY }"; the VideoPress module was not registered.`
			);
		}
	}, 10000 );
}

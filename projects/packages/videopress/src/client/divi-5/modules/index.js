/**
 * Registers all Divi 5 modules with the module library.
 */
import { addAction } from '@wordpress/hooks';
import { videoPressMetadata, videoPressModule } from './videopress';

addAction( 'divi.moduleLibrary.registerModuleLibraryStore.after', 'jetpack-videopress', () => {
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
} );

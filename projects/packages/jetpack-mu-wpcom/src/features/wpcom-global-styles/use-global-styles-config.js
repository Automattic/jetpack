import { useSelect } from '@wordpress/data';

/**
 * Custom hook to detect whether Global Styles are in use.
 *
 * @return {object} An object containing globalStylesInUse and globalStylesId.
 */
export function useGlobalStylesConfig() {
	return useSelect( select => {
		const { getEditedEntityRecord, __experimentalGetCurrentGlobalStylesId } = select( 'core' );

		const _globalStylesId = __experimentalGetCurrentGlobalStylesId
			? __experimentalGetCurrentGlobalStylesId()
			: null;

		// Copy the global styles record to avoid mutating the original.
		const globalStylesRecord = {
			...getEditedEntityRecord( 'root', 'globalStyles', _globalStylesId ),
		};

		const globalStylesConfig = {
			styles: globalStylesRecord?.styles ?? {},
			settings: globalStylesRecord?.settings ?? {},
		};

		if ( window.wpcomGlobalStyles?.hasCustomDesign ) {
			// Create a new styles object without the css property
			const { css: _, ...stylesWithoutCss } = globalStylesConfig.styles;
			globalStylesConfig.styles = stylesWithoutCss;
		}

		// If the global styles are empty, set the styles to an empty object.
		// Gutenberg saves the css property even if it's empty, so we need to check for that.
		if (
			'' === globalStylesConfig.styles.css &&
			Object.keys( globalStylesConfig.styles ).length === 1
		) {
			globalStylesConfig.styles = {};
		}

		// Determine if the global Styles are in use on the current site.
		const globalStylesInUse = !! (
			Object.keys( globalStylesConfig.styles ).length ||
			Object.keys( globalStylesConfig.settings ).length
		);

		return {
			globalStylesInUse,
			globalStylesId: _globalStylesId,
		};
	}, [] );
}

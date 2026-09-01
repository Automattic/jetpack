/**
 * Check if the editor is running in a GutenbergKit (mobile app) environment.
 *
 * @return {boolean} True if running in GutenbergKit, false otherwise.
 */
export const isGutenbergKit = () => {
	return !! window?.GBKit;
};

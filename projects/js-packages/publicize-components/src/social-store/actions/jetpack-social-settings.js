/**
 * Yield actions to refresh all of the Jetpack Social registered settings.
 *
 * @return {object} - an action object.
 */
export function refreshJetpackSocialSettings() {
	return async function ( { dispatch } ) {
		await dispatch.fetchSocialImageGeneratorConfig();
	};
}

export default {
	refreshJetpackSocialSettings,
};

import Configstore from 'configstore';
import enquirer from 'enquirer';

const configStore = new Configstore( 'automattic/jetpack-cli/cli' );

/**
 * Checks if:
 * - the user has been asked to enable analytics tracking.
 * - the user has enabled or disabled analytics tracking.
 *
 * @returns {boolean} Whether analytics tracking is enabled.
 */
async function analyticsEnabled() {
	if ( configStore.get( 'askedToEnableAnalytics' ) === undefined ) {
		const prompt = await enquirer.prompt( [
			{
				type: 'confirm',
				name: 'analyticsEnabled',
				message: 'Enable anonymized analytics tracking to help improve the Jetpack CLI?',
				initial: true,
			},
		] );

		configStore.set( 'askedToEnableAnalytics', true );
		configStore.set( 'analyticsEnabled', prompt.analyticsEnabled );
		console.log(
			prompt.analyticsEnabled
				? 'Thank you for helping us improve Jetpack CLI!'
				: "We appreciate your privacy. If you'd like to enable analytics tracking in the future, run: jetpack cli analytics"
		);
	}
	return configStore.get( 'analyticsEnabled' );
}

/**
 * Record a Tracks event, see: PCYsg-4KT-p2
 *
 * @param {string} eventName - The name of the event to track.
 */
export async function tracks( eventName ) {
	if ( ! ( await analyticsEnabled() ) ) {
		// Bail if the user has disabled analytics tracking.
		return;
	}

	console.log( `Todo: testing tracks(). Event name: ${ eventName }` );
}

import crypto from 'crypto';
import axios from 'axios';
import Configstore from 'configstore';
import enquirer from 'enquirer';

const configStore = new Configstore( 'automattic/jetpack-cli/cli' );
const baseEventName = 'jetpack_test_cli_'; // Todo: remove 'test' prefix before merging and after testing.

/**
 * Checks if:
 * - the user has been asked to enable analytics tracking.
 * - the user has enabled or disabled analytics tracking.
 * - the user has a UUID set.
 *
 * @returns {boolean} Whether analytics tracking is enabled.
 */
async function checkAnalyticsEnabled() {
	if ( configStore.get( 'askedToEnableAnalytics' ) === undefined ) {
		const prompt = await enquirer.prompt( [
			{
				type: 'confirm',
				name: 'analyticsEnabled',
				message: 'Enable analytics tracking to help improve the Jetpack CLI?',
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

	if ( ! configStore.get( 'uuid' ) ) {
		configStore.set( 'uuid', crypto.randomUUID() );
	}

	return configStore.get( 'analyticsEnabled' );
}

/**
 * Record a Tracks event, see: PCYsg-4KT-p2
 *
 * @param {string} eventName - Name to track in format <action>_<optional qualifier> (e.g. 'rsync_watch').
 */
export async function tracks( eventName = 'uncategorized' ) {
	if ( ! ( await checkAnalyticsEnabled() ) ) {
		// Bail if the user has disabled analytics tracking.
		return;
	}

	try {
		await axios.post(
			'https://public-api.wordpress.com/rest/v1.1/tracks/record?http_envelope=1',
			{
				commonProps: {
					_ul: 'jetpackisbestpack',
					uuid: configStore.get( 'uuid' ),
				},
				events: [
					{
						_en: baseEventName + eventName,
					},
				],
			},
			{
				headers: {
					'User-Agent': 'Node.js Jetpack CLI',
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		console.error( error );
	}
}

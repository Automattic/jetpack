import { getMyJetpackUrl, getScriptData } from '@automattic/jetpack-script-data';

/**
 * Return the URL where Jetpack AI is managed on this site, as printed by My Jetpack.
 *
 * Falls back to My Jetpack's AI page when the site did not print one.
 *
 * @return {string} The Jetpack AI manage URL.
 */
export default function getJetpackAiManageUrl() {
	return getScriptData()?.myJetpack?.aiManageUrl || getMyJetpackUrl( '#/jetpack-ai' );
}

/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Whether the site and the reader qualify for the Upgrade to Parse.ly prompts.
 *
 * @return False when the server published no answer.
 */
export function offersParselyPrompts(): boolean {
	return getScriptData()?.premium_analytics?.offers_parsely_prompts === true;
}

/**
 * The Parse.ly self-serve signup page with this site filled in, as the server built it.
 *
 * @return The URL, or undefined when the server published none.
 */
export function getParselySignupUrl(): string | undefined {
	return getScriptData()?.premium_analytics?.parsely_signup_url || undefined;
}

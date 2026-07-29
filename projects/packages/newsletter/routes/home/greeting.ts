import { __, sprintf } from '@wordpress/i18n';
import { getNewsletterModeScriptData } from '../../src/settings/script-data';

/**
 * The page greeting, shared by both faces of the Dashboard so they greet the
 * same way.
 *
 * Uses the current user's nickname or first name when their profile has one —
 * `Mode::maybe_add_script_data()` resolves which — and greets them without a
 * name when it doesn't.
 *
 * @return The greeting line.
 */
export const getGreeting = (): string => {
	const name = getNewsletterModeScriptData()?.greetingName?.trim();

	if ( ! name ) {
		return __( 'Hey there', 'jetpack-newsletter' );
	}

	return sprintf(
		/* translators: %s: the current user's nickname or first name. */
		__( 'Welcome, %s', 'jetpack-newsletter' ),
		name
	);
};

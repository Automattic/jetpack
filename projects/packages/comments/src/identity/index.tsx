import { GuestFields } from './guest-fields';
import { LogInPrompt } from './log-in-prompt';

export { CommentingAs } from './commenting-as';

/**
 * How the reader identifies themselves, which depends on whether the site
 * takes comments from anyone and on whether they are already logged in.
 *
 * @return The prompt to log in, the guest fields, or nothing for a logged-in reader.
 */
export const Identity = () => {
	const { isLoggedIn, mustLogIn } = JetpackComments;

	if ( mustLogIn ) {
		return <LogInPrompt />;
	}

	return isLoggedIn ? null : <GuestFields />;
};

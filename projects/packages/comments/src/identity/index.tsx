import { identityUser } from '../shared/identity';
import { GuestFields } from './guest-fields';
import { LogInPrompt } from './log-in-prompt';

export { CommentingAs } from './commenting-as';

/**
 * How the reader identifies themselves. Someone already known, logged in or
 * signed in through the checkpoint, sees nothing here; the attribution line is drawn
 * in the footer instead. Otherwise it is the log-in prompt when the site
 * requires an account, or the guest fields with the provider buttons inside.
 *
 * @return The prompt with buttons and fields, or nothing.
 */
export const Identity = () => {
	const { mustLogIn } = JetpackComments;

	if ( identityUser.value ) {
		return null;
	}

	return mustLogIn ? <LogInPrompt /> : <GuestFields />;
};

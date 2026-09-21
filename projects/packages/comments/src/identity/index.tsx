import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { LoggedIn } from './checkpoint/logged-in';
import { LoggedOut } from './checkpoint/logged-out';
import { GuestFields } from './guest-fields';
import { LogInPrompt } from './log-in-prompt';

export { CommentingAs } from './commenting-as';

/**
 * How a reader not logged in to the site identifies themselves: the checkpoint
 * where WordPress.com sign-in is available, and the plain guest fields or
 * log-in prompt where it is not.
 *
 * @return The identity block.
 */
export const Identity = () => {
	const { signedIn } = useContext( CommentSignals );
	const { mustLogIn, identity } = JetpackComments;

	if ( identity.providers.length > 0 ) {
		return signedIn.value ? <LoggedIn /> : <LoggedOut />;
	}

	return mustLogIn ? <LogInPrompt /> : <GuestFields />;
};

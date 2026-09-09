import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { LoggedIn } from './checkpoint/logged-in';
import { LoggedOut } from './checkpoint/logged-out';
import { GuestFields } from './guest-fields';
import { LogInPrompt } from './log-in-prompt';

export { CommentingAs } from './commenting-as';

/**
 * The checkpoint, for a reader who is not logged in to the site.
 *
 * @return The signed-in line, or the sign-in row.
 */
const Checkpoint = () => {
	const { signedIn } = useContext( CommentSignals );

	return signedIn.value ? <LoggedIn /> : <LoggedOut />;
};

/**
 * How the reader identifies themselves: nothing for a reader logged in to the
 * site, the checkpoint where WordPress.com sign-in is available, and the
 * plain guest fields or log-in prompt where it is not.
 *
 * @return The identity block.
 */
export const Identity = () => {
	const { isLoggedIn, mustLogIn, identity } = JetpackComments;

	if ( isLoggedIn ) {
		return null;
	}

	if ( identity.providers.length > 0 ) {
		return <Checkpoint />;
	}

	return mustLogIn ? <LogInPrompt /> : <GuestFields />;
};

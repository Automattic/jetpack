import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { LoggedIn } from './checkpoint/logged-in';
import { LoggedOut } from './checkpoint/logged-out';
import { GuestFields } from './guest-fields';
import { LogInPrompt } from './log-in-prompt';
import { SiteUser } from './site-user';

export { CommentingAs } from './commenting-as';

/**
 * The identity block for the current reader.
 *
 * @return The block.
 */
export const Identity = () => {
	const { signedIn } = useContext( CommentSignals );
	const { user, mustLogIn, identity } = JetpackComments;

	if ( user ) {
		return <SiteUser user={ user } />;
	}

	if ( identity.providers.length > 0 ) {
		return signedIn.value ? <LoggedIn /> : <LoggedOut />;
	}

	return mustLogIn ? <LogInPrompt /> : <GuestFields />;
};

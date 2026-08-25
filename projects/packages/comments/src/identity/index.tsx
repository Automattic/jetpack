import { identityUser } from '../shared/identity';
import { ProviderButtons } from './checkpoint/provider-buttons';
import { GuestFields } from './guest-fields';
import { LogInPrompt } from './log-in-prompt';

export { CommentingAs } from './commenting-as';

/**
 * How the reader identifies themselves. Someone already known, logged in or
 * signed in through the checkpoint, sees nothing here; the attribution line is drawn
 * in the footer instead. Otherwise it is the log-in prompt when the site
 * requires an account, or the provider buttons above the guest fields.
 *
 * @return The prompt, the buttons and guest fields, or nothing.
 */
export const Identity = () => {
	const { mustLogIn } = JetpackComments;

	if ( identityUser.value ) {
		return null;
	}

	if ( mustLogIn ) {
		return <LogInPrompt />;
	}

	return (
		<>
			<ProviderButtons />
			<GuestFields />
		</>
	);
};

import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { Disclosure, ProviderButtons } from './checkpoint/provider-buttons';

import './style.scss';

/**
 * Shown when the site only takes comments from registered users. Offers the
 * provider buttons first, then a link to log in with a site account.
 *
 * @return The prompt, the provider buttons, and a way to log in and come back.
 */
export const LogInPrompt = () => {
	const { formSettings } = useContext( CommentSignals );
	const { strings } = JetpackComments;

	return (
		<div className="jetpack-comments__identity">
			<p className="jetpack-comments__prompt">{ strings.mustLogInPrompt }</p>
			<ProviderButtons />
			<a className="jetpack-comments__login" href={ formSettings.loginUrl }>
				{ strings.logIn }
			</a>
			<Disclosure />
		</div>
	);
};

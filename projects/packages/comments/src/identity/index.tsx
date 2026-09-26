import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { CogIcon } from './icons';

import './style.scss';

/**
 * Who the comment will be attributed to, for a reader the site already knows,
 * and a gear to the settings view of the dialog.
 *
 * @return The identity line, or nothing for a reader the dialog will ask.
 */
export const Identity = () => {
	const { formSettings, commenter, signedIn, isDialogOpen, isEditing, isSavedGuest } =
		useContext( CommentSignals );
	const { user, mustLogIn, identity, strings } = JetpackComments;

	if ( mustLogIn && ! identity.canSignIn && ! signedIn.value ) {
		return (
			<span className="jetpack-comments__who">
				{ strings.mustLogIn } <a href={ formSettings.loginUrl }>{ strings.logIn }</a>
			</span>
		);
	}

	let name: string;

	if ( user ) {
		name = user.name;
	} else if ( signedIn.value ) {
		name = strings.viaWordPress.replace( '%s', () => signedIn.value!.name );
	} else if ( isSavedGuest ) {
		name = commenter.value.author;
	} else {
		return null;
	}

	return (
		<span className="jetpack-comments__who">
			{ name }
			{ /* A fresh sign-in posts its code; a returning one a marker, so the server reads the passport only when this was on screen. */ }
			{ signedIn.value &&
				( signedIn.value.code !== null ? (
					<input type="hidden" name={ identity.codeField } value={ signedIn.value.code } />
				) : (
					<input type="hidden" name={ identity.passportField } value="1" />
				) ) }
			<button
				type="button"
				className="jetpack-comments__gear"
				title={ strings.settings }
				onClick={ () => {
					isEditing.value = true;
					isDialogOpen.value = true;
				} }
			>
				<span className="jetpack-comments__visually-hidden">{ strings.settings }</span>
				<CogIcon />
			</button>
		</span>
	);
};

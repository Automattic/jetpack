import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { logOut } from './checkpoint/checkpoint';

import './style.scss';

/**
 * Who the comment will be attributed to, for a reader the site already knows.
 *
 * @return The identity line, or nothing for a reader the dialog will ask.
 */
export const Identity = () => {
	const { formSettings, commenter, signedIn, isDialogOpen, isEditing, isSavedGuest } =
		useContext( CommentSignals );
	const { user, mustLogIn, identity, strings } = JetpackComments;

	if ( user ) {
		return (
			<span className="jetpack-comments__who">
				{ user.name } (<a href={ formSettings.logoutUrl }>{ strings.logOut }</a>)
			</span>
		);
	}

	if ( signedIn.value ) {
		const current = signedIn.value;

		// A fresh sign-in posts its code; a returning one posts a marker, so the
		// server reads the passport only when this was on screen.
		return (
			<span className="jetpack-comments__who">
				{ strings.viaWordPress.replace( '%s', () => current.name ) } (
				<button
					type="button"
					className="jetpack-comments__link-button"
					onClick={ async () => {
						await logOut();
						signedIn.value = null;
					} }
				>
					{ strings.logOut }
				</button>
				)
				{ current.code !== null ? (
					<input type="hidden" name={ identity.codeField } value={ current.code } />
				) : (
					<input type="hidden" name={ identity.passportField } value="1" />
				) }
			</span>
		);
	}

	if ( mustLogIn && ! identity.canSignIn ) {
		return (
			<span className="jetpack-comments__who">
				{ strings.mustLogIn } <a href={ formSettings.loginUrl }>{ strings.logIn }</a>
			</span>
		);
	}

	if ( isSavedGuest ) {
		return (
			<span className="jetpack-comments__who">
				{ commenter.value.author } (
				<button
					type="button"
					className="jetpack-comments__link-button"
					onClick={ () => {
						isEditing.value = true;
						isDialogOpen.value = true;
					} }
				>
					{ strings.change }
				</button>
				)
			</span>
		);
	}

	return null;
};

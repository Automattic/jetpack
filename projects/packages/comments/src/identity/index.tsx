import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { logOut } from './checkpoint/checkpoint';

import './style.scss';

/**
 * Who the comment will be attributed to, for a reader the site already knows,
 * and a way to change that. A new reader is asked in the dialog instead.
 *
 * @return The identity line, or nothing.
 */
export const Identity = () => {
	const { formSettings, signedIn, isModalOpen } = useContext( CommentSignals );
	const { user, commenter, mustLogIn, identity, strings } = JetpackComments;

	if ( user ) {
		return (
			<span className="jetpack-comments__who">
				<span>{ strings.commentingAs.replace( '%s', () => user.name ) }</span>
				<a className="jetpack-comments__logout" href={ formSettings.logoutUrl }>
					{ strings.logOut }
				</a>
			</span>
		);
	}

	if ( signedIn.value ) {
		const current = signedIn.value;

		const leave = async () => {
			// Always, even on a fresh code with no passport yet: the site takes back
			// any httponly cookie, and the next popup is told to ask the provider again.
			await logOut();

			signedIn.value = null;
		};

		// A fresh sign-in posts its code; a returning one posts a marker, so the
		// server uses the passport only when this was on screen.
		return (
			<span className="jetpack-comments__who">
				<span>{ strings.commentingAs.replace( '%s', () => current.name ) }</span>
				<button type="button" className="jetpack-comments__link-button" onClick={ leave }>
					{ strings.logOut }
				</button>
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
			<a className="jetpack-comments__login" href={ formSettings.loginUrl }>
				{ strings.logInToComment }
			</a>
		);
	}

	if ( commenter.author && commenter.email ) {
		return (
			<span className="jetpack-comments__who">
				<span>{ strings.commentingAs.replace( '%s', () => commenter.author ) }</span>
				<button
					type="button"
					className="jetpack-comments__link-button"
					onClick={ () => ( isModalOpen.value = true ) }
				>
					{ strings.edit }
				</button>
			</span>
		);
	}

	return null;
};

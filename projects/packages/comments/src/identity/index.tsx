import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { logOut } from './checkpoint/checkpoint';
import { BellIcon, EnvelopeIcon, LogOutIcon } from './icons';

import './style.scss';

/**
 * Where the reader manages their subscriptions to this site: a bell for a
 * WordPress.com account, which manages them in the Reader, and an envelope for
 * anyone managing them by email address.
 *
 * @return The link, or nothing where the host offers no subscriptions.
 */
const ManageSubscriptions = () => {
	const { signedIn, commenter } = useContext( CommentSignals );
	const { subscriptions, strings } = JetpackComments;
	const byEmail = ! signedIn.value && subscriptions.byEmail;
	const Icon = byEmail ? EnvelopeIcon : BellIcon;
	let url = signedIn.value ? subscriptions.signedInUrl : subscriptions.url;

	// The portal asks for an email address; hand it the one the comment will post under.
	if ( url && byEmail && commenter.value.email ) {
		url += `?email=${ encodeURIComponent( commenter.value.email ) }`;
	}

	if ( ! url ) {
		return null;
	}

	return (
		<a
			className="jetpack-comments__icon-link"
			href={ url }
			title={ strings.manageSubscriptions }
			target="_blank"
			rel="noopener"
		>
			<span className="jetpack-comments__visually-hidden">{ strings.manageSubscriptions }</span>
			<Icon />
		</a>
	);
};

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
				<a
					className="jetpack-comments__icon-link"
					href={ formSettings.logoutUrl }
					title={ strings.logOut }
				>
					<span className="jetpack-comments__visually-hidden">{ strings.logOut }</span>
					<LogOutIcon />
				</a>
				<ManageSubscriptions />
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
				<button
					type="button"
					className="jetpack-comments__icon-link"
					title={ strings.logOut }
					onClick={ leave }
				>
					<span className="jetpack-comments__visually-hidden">{ strings.logOut }</span>
					<LogOutIcon />
				</button>
				<ManageSubscriptions />
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
				<span>{ strings.mustLogIn }</span>
				<a className="jetpack-comments__login" href={ formSettings.loginUrl }>
					{ strings.logIn }
				</a>
			</span>
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
				<ManageSubscriptions />
			</span>
		);
	}

	return null;
};

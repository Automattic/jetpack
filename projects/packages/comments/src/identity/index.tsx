import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { logOut } from './checkpoint/checkpoint';
import { BellIcon, EnvelopeIcon, LogOutIcon, PencilIcon } from './icons';

import './style.scss';

/**
 * Where the reader manages their subscriptions: the Reader for a WordPress.com
 * account, the email portal for anyone else.
 *
 * @return The link, or nothing where the host offers no subscriptions.
 */
const ManageSubscriptions = () => {
	const { signedIn, commenter } = useContext( CommentSignals );
	const { manageSubscriptions: links, strings } = JetpackComments;
	const byEmail = ! signedIn.value && links.byEmail;
	const Icon = byEmail ? EnvelopeIcon : BellIcon;
	let url = signedIn.value ? links.signedInUrl : links.url;

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

		// A fresh sign-in posts its code; a returning one posts a marker, so the
		// server reads the passport only when this was on screen.
		return (
			<span className="jetpack-comments__who">
				<span>{ strings.commentingAs.replace( '%s', () => current.name ) }</span>
				<button
					type="button"
					className="jetpack-comments__icon-link"
					title={ strings.logOut }
					onClick={ async () => {
						await logOut();
						signedIn.value = null;
					} }
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
				<a href={ formSettings.loginUrl }>{ strings.logIn }</a>
			</span>
		);
	}

	if ( isSavedGuest ) {
		return (
			<span className="jetpack-comments__who">
				<span>{ strings.commentingAs.replace( '%s', () => commenter.value.author ) }</span>
				<button
					type="button"
					className="jetpack-comments__icon-link"
					title={ strings.edit }
					onClick={ () => {
						isEditing.value = true;
						isDialogOpen.value = true;
					} }
				>
					<span className="jetpack-comments__visually-hidden">{ strings.edit }</span>
					<PencilIcon />
				</button>
				<ManageSubscriptions />
			</span>
		);
	}

	return null;
};

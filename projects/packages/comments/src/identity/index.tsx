import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { logOut } from './checkpoint/checkpoint';
import { ChevronDownIcon } from './icons';

import './style.scss';

/**
 * Who the comment will be attributed to, for a reader the site already knows,
 * with a chevron that drops the options out under the footer.
 *
 * @return The identity line, or nothing for a reader the dialog will ask.
 */
export const Identity = () => {
	const { formSettings, commenter, signedIn, isMenuOpen, isSavedGuest } =
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
		name = signedIn.value.name;
	} else if ( isSavedGuest ) {
		name = commenter.value.author;
	} else {
		return null;
	}

	const open = isMenuOpen.value;

	return (
		<span className={ clsx( 'jetpack-comments__who', { 'is-open': open } ) }>
			{ /* A fresh sign-in posts its code; a returning one a marker, so the server reads the passport only when this was on screen. */ }
			{ signedIn.value &&
				( signedIn.value.code !== null ? (
					<input type="hidden" name={ identity.codeField } value={ signedIn.value.code } />
				) : (
					<input type="hidden" name={ identity.passportField } value="1" />
				) ) }
			{ name }
			<button
				type="button"
				className="jetpack-comments__chevron"
				title={ strings.options }
				aria-expanded={ open }
				onClick={ () => ( isMenuOpen.value = ! open ) }
			>
				<span className="jetpack-comments__visually-hidden">{ strings.options }</span>
				<ChevronDownIcon />
			</button>
		</span>
	);
};

/**
 * The options the chevron drops out: log out or change details, and where to
 * manage subscriptions.
 *
 * @return The options, or nothing for a reader the dialog will ask.
 */
export const IdentityOptions = () => {
	const { formSettings, commenter, signedIn, isKnown, isMenuOpen, isDialogOpen, isEditing } =
		useContext( CommentSignals );
	const { user, strings } = JetpackComments;

	if ( ! isKnown.value ) {
		return null;
	}

	// Absent from a page cached before this key existed; the row then has no manage link.
	const links = JetpackComments.manageSubscriptions ?? { url: '', byEmail: true, signedInUrl: '' };
	const byEmail = ! signedIn.value && links.byEmail;
	let manageUrl = signedIn.value ? links.signedInUrl : links.url;

	// The portal asks for an email address; hand it the one the comment will post under.
	if ( manageUrl && byEmail && commenter.value.email ) {
		manageUrl += `?email=${ encodeURIComponent( commenter.value.email ) }`;
	}

	return (
		<div className={ clsx( 'jetpack-comments__options', { 'is-open': isMenuOpen.value } ) }>
			<div>
				{ user && <a href={ formSettings.logoutUrl }>{ strings.logOut }</a> }
				{ /* Anchors, not buttons, so the theme styles them like the link beside them. */ }
				{ ! user && signedIn.value && (
					<a
						href="#"
						onClick={ async event => {
							event.preventDefault();
							await logOut();
							signedIn.value = null;
							isMenuOpen.value = false;
						} }
					>
						{ strings.logOut }
					</a>
				) }
				{ ! user && ! signedIn.value && (
					<a
						href="#"
						onClick={ event => {
							event.preventDefault();
							isEditing.value = true;
							isDialogOpen.value = true;
						} }
					>
						{ strings.changeDetails }
					</a>
				) }
				{ manageUrl && (
					<a href={ manageUrl } target="_blank" rel="noopener">
						{ strings.manageSubscriptions }
					</a>
				) }
			</div>
		</div>
	);
};

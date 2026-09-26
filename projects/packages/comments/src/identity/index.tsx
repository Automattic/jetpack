import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { logOut } from './checkpoint/checkpoint';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

import './style.scss';

/**
 * Who the comment will be attributed to, for a reader the site already knows.
 * A chevron slides the name out and the options in behind it: log out or
 * change details, and where to manage subscriptions.
 *
 * @return The identity line, or nothing for a reader the dialog will ask.
 */
export const Identity = () => {
	const { formSettings, commenter, signedIn, isMenuOpen, isDialogOpen, isEditing, isSavedGuest } =
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

	// Absent from a page cached before this key existed; the row then has no manage link.
	const links = JetpackComments.manageSubscriptions ?? { url: '', byEmail: true, signedInUrl: '' };
	const byEmail = ! signedIn.value && links.byEmail;
	let manageUrl = signedIn.value ? links.signedInUrl : links.url;

	// The portal asks for an email address; hand it the one the comment will post under.
	if ( manageUrl && byEmail && commenter.value.email ) {
		manageUrl += `?email=${ encodeURIComponent( commenter.value.email ) }`;
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
			<span className="jetpack-comments__panel jetpack-comments__panel--name" aria-hidden={ open }>
				{ name }
				<button
					type="button"
					className="jetpack-comments__chevron"
					title={ strings.options }
					aria-expanded={ open }
					onClick={ () => ( isMenuOpen.value = true ) }
				>
					<span className="jetpack-comments__visually-hidden">{ strings.options }</span>
					<ChevronRightIcon />
				</button>
			</span>
			<span
				className="jetpack-comments__panel jetpack-comments__panel--options"
				aria-hidden={ ! open }
			>
				<button
					type="button"
					className="jetpack-comments__chevron"
					title={ strings.back }
					onClick={ () => ( isMenuOpen.value = false ) }
				>
					<span className="jetpack-comments__visually-hidden">{ strings.back }</span>
					<ChevronLeftIcon />
				</button>
				{ user && <a href={ formSettings.logoutUrl }>{ strings.logOut }</a> }
				{ ! user && signedIn.value && (
					<button
						type="button"
						className="jetpack-comments__link-button"
						onClick={ async () => {
							await logOut();
							signedIn.value = null;
							isMenuOpen.value = false;
						} }
					>
						{ strings.logOut }
					</button>
				) }
				{ ! user && ! signedIn.value && (
					<button
						type="button"
						className="jetpack-comments__link-button"
						onClick={ () => {
							isEditing.value = true;
							isDialogOpen.value = true;
						} }
					>
						{ strings.changeDetails }
					</button>
				) }
				{ manageUrl && (
					<a href={ manageUrl } target="_blank" rel="noopener">
						{ strings.manageSubscriptions }
					</a>
				) }
			</span>
		</span>
	);
};

import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { logOut } from './checkpoint/checkpoint';
import { ChevronIcon } from './icons';

import './style.scss';

/**
 * Who the comment will be attributed to, for a reader the site already knows,
 * and a chevron that drops the options below the box.
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
				className={ clsx( 'jetpack-comments__chevron', { 'is-open': isMenuOpen.value } ) }
				title={ strings.options }
				aria-expanded={ isMenuOpen.value }
				aria-controls={ `jetpack-comments-menu-${ formSettings.postId }` }
				onClick={ () => ( isMenuOpen.value = ! isMenuOpen.value ) }
			>
				<span className="jetpack-comments__visually-hidden">{ strings.options }</span>
				<ChevronIcon />
			</button>
		</span>
	);
};

/**
 * The options the chevron drops below the box: log out or change details, and where to manage subscriptions.
 *
 * @return The links.
 */
export const IdentityMenu = () => {
	const { formSettings, commenter, signedIn, isDialogOpen, isEditing } =
		useContext( CommentSignals );
	const { user, manageSubscriptions: links, strings } = JetpackComments;

	const byEmail = ! signedIn.value && links.byEmail;
	let manageUrl = signedIn.value ? links.signedInUrl : links.url;

	// The portal asks for an email address; hand it the one the comment will post under.
	if ( manageUrl && byEmail && commenter.value.email ) {
		manageUrl += `?email=${ encodeURIComponent( commenter.value.email ) }`;
	}

	return (
		<div id={ `jetpack-comments-menu-${ formSettings.postId }` } className="jetpack-comments__menu">
			{ user && <a href={ formSettings.logoutUrl }>{ strings.logOut }</a> }
			{ ! user && signedIn.value && (
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
		</div>
	);
};

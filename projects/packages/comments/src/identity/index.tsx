import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { logOut } from './checkpoint/checkpoint';

import './style.scss';

/**
 * Who the comment will be attributed to, in the footer: a link to the dialog until
 * the site knows the commenter, then their name, with a chevron that opens the options.
 *
 * @return The identity line.
 */
export const Identity = () => {
	const { formSettings, details, commenter, isOptionsOpen, isDialogOpen } =
		useContext( CommentSignals );
	const { mustLogIn, identity, strings } = JetpackComments;
	const current = commenter.value;

	if ( current.kind === 'unknown' && mustLogIn && ! identity.canSignIn ) {
		return (
			<span className="jetpack-comments__who">
				{ strings.mustLogIn } <a href={ formSettings.loginUrl }>{ strings.logIn }</a>
			</span>
		);
	}

	if ( current.kind === 'unknown' ) {
		return (
			<span className="jetpack-comments__who">
				<a
					href="#"
					aria-haspopup="dialog"
					onClick={ event => {
						event.preventDefault();
						isDialogOpen.value = true;
					} }
				>
					{ mustLogIn ? strings.logInWithWordPress : strings.addYourName }
				</a>
			</span>
		);
	}

	const open = isOptionsOpen.value;

	return (
		<span className={ clsx( 'jetpack-comments__who', { 'is-open': open } ) }>
			{ /* A fresh sign-in posts its code; a returning one a marker, so the server reads the passport only when this was on screen. */ }
			{ current.kind === 'wordpress' &&
				( current.code !== null ? (
					<input type="hidden" name={ identity.codeField } value={ current.code } />
				) : (
					<input type="hidden" name={ identity.passportField } value="1" />
				) ) }
			{ current.kind === 'guest' ? details.value.author : current.name }
			<button
				type="button"
				className="jetpack-comments__chevron"
				title={ strings.options }
				aria-expanded={ open }
				onClick={ () => ( isOptionsOpen.value = ! open ) }
			>
				<span className="jetpack-comments__visually-hidden">{ strings.options }</span>
				<svg
					viewBox="0 0 24 24"
					width="24"
					height="24"
					fill="currentColor"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M17.5 11.6 12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z" />
				</svg>
			</button>
		</span>
	);
};

/**
 * The row the chevron drops below the box: log out, and where to manage subscriptions.
 *
 * @return The options, or nothing for a commenter the dialog will ask.
 */
export const Options = () => {
	const { formSettings, details, commenter, isOptionsOpen, forget } = useContext( CommentSignals );
	const { strings } = JetpackComments;
	const { kind } = commenter.value;

	if ( kind === 'unknown' ) {
		return null;
	}

	// Absent from a page cached before this key existed; the row then has no manage link.
	const links = JetpackComments.manageSubscriptions ?? { url: '', byEmail: true, signedInUrl: '' };
	let manageUrl = kind === 'wordpress' ? links.signedInUrl : links.url;

	// The portal asks for an email address; hand it the one the comment will post under.
	if ( manageUrl && kind !== 'wordpress' && links.byEmail && details.value.email ) {
		manageUrl += `?email=${ encodeURIComponent( details.value.email ) }`;
	}

	return (
		<div className={ clsx( 'jetpack-comments__options', { 'is-open': isOptionsOpen.value } ) }>
			<div>
				{ /* Anchors, not buttons, so the theme styles them like the link beside them. */ }
				<a
					href={ formSettings.logoutUrl || '#' }
					onClick={ async event => {
						event.preventDefault();

						// Core's log-out leaves a popup sign-in behind, which would sign them straight back in.
						if ( kind === 'user' ) {
							await logOut();
							window.location.href = formSettings.logoutUrl;
							return;
						}

						// Read before the await: currentTarget is gone once the click is dispatched.
						const root = event.currentTarget.closest( '.jetpack-comments' );

						await logOut();
						forget();
						isOptionsOpen.value = false;
						// This link unmounts; a timeout lets the footer's dialog link render to take focus.
						window.setTimeout( () =>
							root?.querySelector< HTMLElement >( '.jetpack-comments__who a' )?.focus()
						);
					} }
				>
					{ strings.logOut }
				</a>
				{ manageUrl && (
					<a href={ manageUrl } target="_blank" rel="noopener">
						{ strings.manageSubscriptions }
					</a>
				) }
			</div>
		</div>
	);
};

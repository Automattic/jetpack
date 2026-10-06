import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { logOut } from './checkpoint/checkpoint';

import './style.scss';

/**
 * Who the comment will be attributed to, in the footer: a link to the dialog until
 * the site knows the commenter, then their avatar and name, linked to a site user's
 * profile or a guest's subscriptions, and Change for a guest or Log out for anyone else.
 *
 * @return The identity line.
 */
export const Identity = () => {
	const { formSettings, details, commenter, isDialogOpen, forget } = useContext( CommentSignals );
	const { mustLogIn, identity, strings, avatarUrl, user } = JetpackComments;
	const current = commenter.value;

	// Only where the site shows avatars; a commenter it does not know gets its default.
	const avatarSrc =
		avatarUrl &&
		( ( current.kind === 'wordpress' && current.avatar ) ||
			( current.kind === 'unknown' ? identity.defaultAvatar : avatarUrl ) );
	const avatar = avatarSrc && (
		<img
			className="jetpack-comments__avatar avatar avatar-40 photo"
			src={ avatarSrc }
			alt=""
			width="40"
			height="40"
		/>
	);

	const openDialog = ( event: Event ) => {
		event.preventDefault();
		isDialogOpen.value = true;
	};

	if ( current.kind === 'unknown' ) {
		return (
			<span className="jetpack-comments__identity">
				{ avatar }
				{ mustLogIn && ! identity.canSignIn ? (
					<span>
						{ strings.mustLogIn } <a href={ formSettings.loginUrl }>{ strings.logIn }</a>
					</span>
				) : (
					<a href="#" aria-haspopup="dialog" onClick={ openDialog }>
						{ mustLogIn ? strings.logInWithWordPress : strings.addYourName }
					</a>
				) }
			</span>
		);
	}

	// A site user's own profile, as core links it. Subscriptions only for a guest: their email
	// is the one the comment posts under, where anyone else's details are leftover cookies.
	// The manage URL is empty where the Newsletter is off, and on a page cached before it existed.
	const manageUrl = JetpackComments.manageSubscriptionsUrl ?? '';
	let profile = { url: '', label: '' };

	if ( current.kind === 'user' && user?.editProfileUrl ) {
		profile = { url: user.editProfileUrl, label: strings.editProfile };
	} else if ( current.kind === 'guest' && manageUrl && details.value.email ) {
		profile = {
			url: `${ manageUrl }&email=${ encodeURIComponent( details.value.email ) }`,
			label: strings.manageSubscriptions,
		};
	}

	// Subscriptions open beside the post; a profile replaces it, as core's link does.
	const opens = current.kind === 'user' ? {} : { target: '_blank', rel: 'noopener' };
	const name = current.kind === 'guest' ? details.value.author : current.name;

	return (
		<span className="jetpack-comments__identity">
			{ /* A fresh sign-in posts its code; a returning one a marker, so the server reads the passport only when this was on screen. */ }
			{ current.kind === 'wordpress' &&
				( current.code !== null ? (
					<input type="hidden" name={ identity.codeField } value={ current.code } />
				) : (
					<input type="hidden" name={ identity.passportField } value="1" />
				) ) }
			{ /* The avatar repeats the name's link for the pointer; Tab and screen readers get the name's alone. */ }
			{ profile.url && avatar ? (
				<a
					className="jetpack-comments__avatar-link"
					href={ profile.url }
					tabIndex={ -1 }
					aria-hidden="true"
					{ ...opens }
				>
					{ avatar }
				</a>
			) : (
				avatar
			) }
			<span className="jetpack-comments__profile">
				{ profile.url ? (
					<a
						className="jetpack-comments__name"
						href={ profile.url }
						title={ profile.label }
						{ ...opens }
					>
						{ name }
						<span className="jetpack-comments__visually-hidden">{ ` ${ profile.label }` }</span>
					</a>
				) : (
					<span className="jetpack-comments__name">{ name }</span>
				) }
				{ current.kind === 'guest' ? (
					<a
						className="jetpack-comments__link"
						href="#"
						aria-haspopup="dialog"
						onClick={ openDialog }
					>
						{ strings.change }
					</a>
				) : (
					<a
						className="jetpack-comments__link"
						href={ formSettings.logoutUrl || '#' }
						onClick={ async event => {
							event.preventDefault();

							// Core's log-out leaves a popup sign-in behind, which would sign them straight back in.
							if ( current.kind === 'user' ) {
								await logOut();
								window.location.href = formSettings.logoutUrl;
								return;
							}

							// Read before the await: currentTarget is gone once the click is dispatched.
							const root = event.currentTarget.closest( '.jetpack-comments' );

							await logOut();
							forget();
							// This link unmounts; a timeout lets "Add your name" render to take focus.
							window.setTimeout( () =>
								root?.querySelector< HTMLElement >( '.jetpack-comments__identity a' )?.focus()
							);
						} }
					>
						{ strings.logOut }
					</a>
				) }
			</span>
		</span>
	);
};

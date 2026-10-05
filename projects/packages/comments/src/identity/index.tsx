import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';

import './style.scss';

/**
 * Who the comment will be attributed to, in the footer: a link to the dialog until
 * the site knows the commenter, then their name, linked to their subscriptions, over
 * core's profile and log out links for a site user, or a way to change who they are.
 *
 * @return The identity line.
 */
export const Identity = () => {
	const { formSettings, details, commenter, isDialogOpen } = useContext( CommentSignals );
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

	// Empty where the site offers no subscriptions, and on a page cached before this key existed.
	let manageUrl = JetpackComments.manageSubscriptionsUrl ?? '';

	// Logged out, the portal asks for an email address; hand it a guest's. Anyone else's
	// details are leftover cookies, which on Simple can come from another site.
	if ( manageUrl && current.kind === 'guest' && details.value.email ) {
		manageUrl += `&email=${ encodeURIComponent( details.value.email ) }`;
	}

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
			{ avatar }
			<span className="jetpack-comments__profile">
				{ manageUrl ? (
					<a
						className="jetpack-comments__name"
						href={ manageUrl }
						target="_blank"
						rel="noopener"
						title={ strings.manageSubscriptions }
					>
						{ name }
						<span className="jetpack-comments__visually-hidden">
							{ ` ${ strings.manageSubscriptions }` }
						</span>
					</a>
				) : (
					<span className="jetpack-comments__name">{ name }</span>
				) }
				<span className="jetpack-comments__links">
					{ /* A session on this site gets core's links; one anywhere else is not this site's to end. */ }
					{ current.kind === 'user' ? (
						<>
							{ user?.editProfileUrl && (
								<a href={ user.editProfileUrl }>{ strings.editProfile }</a>
							) }
							<a href={ formSettings.logoutUrl }>{ strings.logOut }</a>
						</>
					) : (
						<a href="#" aria-haspopup="dialog" onClick={ openDialog }>
							{ strings.change }
						</a>
					) }
				</span>
			</span>
		</span>
	);
};

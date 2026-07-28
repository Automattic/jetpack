import { Signal } from '@preact/signals';
import clsx from 'clsx';
import { useContext, useEffect, useState } from 'preact/hooks';
import { translate } from '../i18n';
import { VerbumSignals } from '../state';
import { serviceData } from '../utils';
import { EmailForm } from './EmailForm';
import type { SocialServiceName } from '../hooks/useSocialLogin';

const { mustLogIn, requireNameEmail, commentRegistration } = VerbumComments;
interface LoggedOutProps {
	login: ( service: SocialServiceName ) => void;
	canWeAccessCookies: boolean;
	loginWindow: Window | null;
}

const getLoginCommentText = ( commentParent: Signal ) => {
	let defaultText = translate( 'Log in to leave a comment.' );
	let optionalText = translate( 'Leave a comment. (log in optional)' );
	let nameAndEmailRequired = translate(
		'Log in or provide your name and email to leave a comment.'
	);

	if ( commentParent.value ) {
		defaultText = translate( 'Log in to leave a reply.' );
		optionalText = translate( 'Leave a reply. (log in optional)' );
		nameAndEmailRequired = translate( 'Log in or provide your name and email to leave a reply.' );
	}

	const allowCommentsWithoutLogin = ! requireNameEmail && ! commentRegistration;
	const requiresEmailandNameToComment = requireNameEmail && ! commentRegistration;

	if ( requiresEmailandNameToComment ) {
		return <span>{ nameAndEmailRequired }</span>;
	}
	if ( allowCommentsWithoutLogin ) {
		return <span>{ optionalText }</span>;
	}

	return <span>{ defaultText }</span>;
};

/**
 * Build a top-level login URL for the site the comment form belongs to.
 *
 * On Atomic/Jetpack the comment form runs inside a cross-origin iframe, so the parent post URL
 * is passed in via the location hash (`#parent=…`). We log in against that site so the visitor
 * returns authenticated (via Jetpack SSO) and can comment.
 *
 * @return {string} - The site's login URL, or the bare target if it can't be parsed.
 */
const getSiteLoginUrl = () => {
	const parentUrl = decodeURIComponent(
		window.location.hash.match( /[#&]parent=([^&]*)/ )?.[ 1 ] ?? ''
	);

	const target = parentUrl || VerbumComments.homeURL || '';

	try {
		return `${ new URL( target ).origin }/wp-login.php?redirect_to=${ encodeURIComponent(
			target
		) }`;
	} catch {
		return target;
	}
};

export const LoggedOut = ( { login, canWeAccessCookies, loginWindow }: LoggedOutProps ) => {
	const [ activeService, setActiveService ] = useState( '' );
	const closeLoginPopupService = requireNameEmail && ! mustLogIn ? 'mail' : '';

	// Handle window closing without login
	useEffect( () => {
		if ( ! loginWindow && activeService && activeService !== 'mail' ) {
			setActiveService( closeLoginPopupService );
		}
	}, [ loginWindow, activeService, closeLoginPopupService ] );

	useEffect( () => {
		// Handle cases when name and email are required but without login.
		if ( requireNameEmail && ! commentRegistration ) {
			setActiveService( 'mail' );
		}
	}, [ setActiveService ] );

	const handleClick = ( event: MouseEvent, service: string ) => {
		event.preventDefault();

		if ( activeService === service ) {
			setActiveService( '' );
			loginWindow?.close();
			return;
		}

		switch ( service ) {
			case 'wordpress':
			case 'facebook':
				login( service );
				break;
			case 'guest':
				if ( [ 'wordpress', 'facebook' ].includes( activeService ) ) {
					loginWindow?.close();
				}
				break;
		}

		setActiveService( service );
	};

	const { commentParent } = useContext( VerbumSignals );

	// In the iframe (Atomic/Jetpack) we offer social login and request cookie access on click,
	// so the buttons render even when the cookie test currently fails.
	const showSocialButtons = canWeAccessCookies || !! VerbumComments.isJetpackComments;

	// Login is required but cookies are blocked, so an in-frame login may not stick. Keep the
	// top-level login link on offer — without it, a denied cookie prompt is a dead end again.
	const showSiteLogin = mustLogIn && ! canWeAccessCookies;

	if ( showSiteLogin && ! showSocialButtons ) {
		return (
			<div className="verbum-subscriptions logged-out">
				<div className="verbum-subscriptions__wrapper">
					<div className="verbum-subscriptions__login verbum-subscriptions__login-required">
						<div className="verbum-subscriptions__login-header">
							{ getLoginCommentText( commentParent ) }
						</div>
						<a
							className="components-button is-primary"
							href={ getSiteLoginUrl() }
							target="_top"
							rel="noopener noreferrer"
						>
							{ translate( 'Log in' ) }
						</a>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="verbum-subscriptions logged-out">
			<div className="verbum-subscriptions__wrapper">
				<div className="verbum-subscriptions__login">
					{ showSocialButtons && (
						<>
							<div className="verbum-subscriptions__login-header">
								{ getLoginCommentText( commentParent ) }
							</div>
							<div
								className={ clsx( 'verbum-logins', {
									'logging-in': activeService,
								} ) }
							>
								<div
									className={ clsx( 'verbum-logins__social-buttons', {
										'show-form-content': ! mustLogIn,
									} ) }
								>
									{ Object.entries( serviceData ).map( ( [ service, value ] ) => {
										// Don't show mail login if "Users must be registered and logged in to comment" enabled.
										if ( mustLogIn && service === 'mail' ) {
											// eslint-disable-next-line array-callback-return
											return;
										}

										return (
											<button
												aria-label={ value.name }
												type="button"
												key={ service }
												onClick={ e => handleClick( e, service ) }
												className={ clsx( 'social-button', service, {
													active: service === activeService,
												} ) }
											>
												<value.icon />
											</button>
										);
									} ) }
								</div>
								{ [ 'wordpress', 'facebook' ].includes( activeService ) && (
									<div
										className={ clsx( 'verbum-login__social-loading', {
											'must-login': mustLogIn,
										} ) }
									>
										<p></p>
										<button
											type="button"
											className="components-button is-link"
											onClick={ () => {
												setActiveService( closeLoginPopupService );
												loginWindow?.close();
											} }
										>
											{ translate( 'Cancel' ) }
										</button>
									</div>
								) }
							</div>
						</>
					) }
					{ showSiteLogin && showSocialButtons && (
						<a
							className="components-button is-link verbum-subscriptions__login-link"
							href={ getSiteLoginUrl() }
							target="_top"
							rel="noopener noreferrer"
						>
							{ translate( 'Log in' ) }
						</a>
					) }
					<EmailForm
						shouldShowEmailForm={
							activeService === 'mail' || ( ! canWeAccessCookies && ! mustLogIn )
						}
					/>
				</div>
			</div>
		</div>
	);
};

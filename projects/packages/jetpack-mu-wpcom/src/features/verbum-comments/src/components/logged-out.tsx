import { Signal } from '@preact/signals';
import clsx from 'clsx';
import { useContext, useEffect, useState } from 'preact/hooks';
import { translate } from '../i18n';
import { VerbumSignals } from '../state';
import { COOKIE_NOTICE_ID, serviceData } from '../utils';
import { EmailForm } from './EmailForm';
import type { SocialServiceName } from '../hooks/useSocialLogin';
import type { ComponentChildren } from 'preact';

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

const LoggedOutWrapper = ( { children }: { children: ComponentChildren } ) => (
	<div className="verbum-subscriptions logged-out">
		<div className="verbum-subscriptions__wrapper">
			<div className="verbum-subscriptions__login">{ children }</div>
		</div>
	</div>
);

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

	if ( ! canWeAccessCookies ) {
		if ( mustLogIn ) {
			return (
				<LoggedOutWrapper>
					<div className="verbum-subscriptions__login-header">
						{ getLoginCommentText( commentParent ) }
					</div>
					<p className="verbum-subscriptions__cookie-notice" id={ COOKIE_NOTICE_ID }>
						{ translate(
							'Commenting here requires cookie access. Allow cookies for this site, then reload the page.'
						) }
					</p>
				</LoggedOutWrapper>
			);
		}

		return (
			<LoggedOutWrapper>
				<p className="verbum-subscriptions__cookie-notice">
					{ translate(
						'Your browser is blocking cookies, so WordPress.com login is unavailable here.'
					) }
				</p>
				<EmailForm shouldShowEmailForm />
			</LoggedOutWrapper>
		);
	}

	return (
		<LoggedOutWrapper>
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
			<EmailForm shouldShowEmailForm={ activeService === 'mail' } />
		</LoggedOutWrapper>
	);
};

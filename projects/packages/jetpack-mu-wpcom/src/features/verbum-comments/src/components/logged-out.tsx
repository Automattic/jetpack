import clsx from 'clsx';
import { useEffect, useState } from 'preact/hooks';
import { translate } from '../i18n';
import { commentParent } from '../state';
import { serviceData } from '../utils';
import { EmailForm } from './EmailForm';

const { mustLogIn, requireNameEmail, commentRegistration } = VerbumComments;
interface LoggedOutProps {
	login: ( service: string ) => void;
	canWeAccessCookies: boolean;
	loginWindow: Window | null;
}

const getLoginCommentText = () => {
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

	return (
		<div className="verbum-subscriptions logged-out">
			<div className="verbum-subscriptions__wrapper">
				<div className="verbum-subscriptions__login">
					{ canWeAccessCookies && (
						<>
							<div className="verbum-subscriptions__login-header">{ getLoginCommentText() }</div>
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
												loginWindow.close();
											} }
										>
											{ translate( 'Cancel' ) }
										</button>
									</div>
								) }
							</div>
						</>
					) }
					<EmailForm shouldShowEmailForm={ activeService === 'mail' || ! canWeAccessCookies } />
				</div>
			</div>
		</div>
	);
};

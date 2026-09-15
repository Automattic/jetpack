import clsx from 'clsx';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { CommentSignals } from '../../shared/state';
import { GuestFields } from '../guest-fields';
import { signIn } from './checkpoint';
import { FacebookIcon, GoogleIcon, MailIcon, WordPressIcon } from './icons';
import type { Provider } from '../../shared/types';

import './style.scss';

const icons = {
	wordpress: WordPressIcon,
	google: GoogleIcon,
	facebook: FacebookIcon,
	mail: MailIcon,
};

/**
 * The sign-in row: a prompt, one round button per provider, and the guest
 * fields behind the mail button.
 *
 * @return The logged-out identity block.
 */
export const LoggedOut = () => {
	const { activeService, isSigningIn, signInError, signedIn, commentParent } =
		useContext( CommentSignals );
	const { requireNameEmail, mustLogIn, strings, identity } = JetpackComments;
	const popup = useRef< Window | null >( null );
	// Bumped per sign-in, so a popup closed to open another cannot answer for it.
	const attempt = useRef( 0 );

	// Where a cancelled sign-in lands: back on the guest fields when the site needs them.
	const restingService = requireNameEmail && ! mustLogIn ? 'mail' : '';

	useEffect( () => {
		activeService.value = restingService;
	}, [ activeService, restingService ] );

	const prompt = () => {
		const isReply = commentParent.value > 0;

		if ( mustLogIn ) {
			return isReply ? strings.logInToReply : strings.mustLogInPrompt;
		}

		if ( requireNameEmail ) {
			return isReply ? strings.logInOrProvideReply : strings.logInOrProvide;
		}

		return isReply ? strings.logInOptionalReply : strings.logInOptional;
	};

	// Bumping the attempt means a code the popup posted on its way out is ignored.
	const abandon = () => {
		attempt.current++;
		popup.current?.close();
		popup.current = null;
	};

	const cancel = () => {
		abandon();
		activeService.value = restingService;
	};

	const start = async ( provider: Provider ) => {
		signInError.value = '';
		activeService.value = provider;

		const current = ++attempt.current;

		const result = await signIn( provider, opened => {
			popup.current = opened;
		} );

		if ( current !== attempt.current ) {
			return;
		}

		popup.current = null;

		if ( 'code' in result ) {
			signedIn.value = { provider, name: result.name, avatar: result.avatar, code: result.code };
			activeService.value = '';
			return;
		}

		if ( 'error' in result ) {
			signInError.value =
				result.error === 'rate_limited' ? strings.signInRateLimited : strings.signInFailed;
		}

		activeService.value = restingService;
	};

	const choose = ( service: Provider | 'mail' ) => {
		if ( activeService.value === service ) {
			if ( service !== 'mail' ) {
				cancel();
			} else if ( restingService !== 'mail' ) {
				// Required fields stay open, or the browser could not validate them.
				activeService.value = '';
			}
			return;
		}

		if ( isSigningIn.value ) {
			abandon();
		}

		if ( service === 'mail' ) {
			activeService.value = 'mail';
			return;
		}

		start( service );
	};

	const services: Array< Provider | 'mail' > = mustLogIn
		? identity.providers
		: [ ...identity.providers, 'mail' ];

	return (
		<div className="jetpack-comments__identity">
			<p className="jetpack-comments__prompt">{ prompt() }</p>
			{ signInError.value && (
				<p className="jetpack-comments__notice" role="status">
					{ signInError.value }
				</p>
			) }
			<div className={ clsx( 'jetpack-comments__logins', { 'is-signing-in': isSigningIn.value } ) }>
				<div
					className={ clsx( 'jetpack-comments__login-buttons', {
						'has-guest-form': ! mustLogIn,
					} ) }
				>
					{ services.map( service => {
						const Icon = icons[ service ];

						return (
							<button
								key={ service }
								type="button"
								aria-label={ strings.providers[ service ] }
								className={ clsx( 'jetpack-comments__login-button', `is-${ service }`, {
									'is-active': activeService.value === service,
								} ) }
								onClick={ () => choose( service ) }
							>
								<Icon />
							</button>
						);
					} ) }
				</div>
				{ isSigningIn.value && (
					<div className="jetpack-comments__signing-in">
						<span className="jetpack-comments__spinner" aria-hidden="true" />
						<button type="button" className="jetpack-comments__cancel" onClick={ cancel }>
							{ strings.cancel }
						</button>
					</div>
				) }
			</div>
			<GuestFields open={ activeService.value === 'mail' } bare />
		</div>
	);
};

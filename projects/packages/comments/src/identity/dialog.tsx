import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { signIn } from './checkpoint/checkpoint';
import { CloseIcon, WordPressIcon } from './icons';
import type { Commenter } from '../shared/types';

import './style.scss';

/**
 * Asks a reader the site does not know who they are, on their way to posting.
 *
 * It sits inside the form, so its fields post with the comment. "Save and post"
 * is the submit button carrying core's cookies-consent field; "No, thanks"
 * submits without it, so core clears any saved details instead.
 *
 * @return The dialog.
 */
export const IdentityDialog = () => {
	const { formSettings, commenter, signedIn, isModalOpen } = useContext( CommentSignals );
	const { site, strings, isLoggedIn, mustLogIn, requireNameEmail, identity } = JetpackComments;
	const dialog = useRef< HTMLDialogElement >( null );
	const popup = useRef< Window | null >( null );
	// Bumped per sign-in, so a popup closed to open another cannot answer for it.
	const attempt = useRef( 0 );
	const [ isSigningIn, setIsSigningIn ] = useState( false );
	const [ signInError, setSignInError ] = useState( '' );
	const submitOnSignIn = useRef( false );

	useEffect( () => {
		const element = dialog.current;

		if ( isModalOpen.value && ! element?.open ) {
			element?.showModal();
		} else if ( ! isModalOpen.value && element?.open ) {
			element.close();
		}
	}, [ isModalOpen.value ] );

	// The dialog was opened by a submit, so a sign-in that lands finishes it. From an
	// effect, because the identity line renders the hidden code input on the same
	// commit, and a submit made straight after setting signedIn posts without it.
	useEffect( () => {
		if ( submitOnSignIn.current && signedIn.value ) {
			submitOnSignIn.current = false;
			dialog.current?.closest( 'form' )?.requestSubmit();
		}
	}, [ signedIn.value ] );

	const cancel = () => {
		attempt.current++;
		popup.current?.close();
		popup.current = null;
		setIsSigningIn( false );
	};

	const start = async () => {
		setSignInError( '' );
		setIsSigningIn( true );

		const current = ++attempt.current;

		const result = await signIn( opened => {
			popup.current = opened;
		} );

		if ( current !== attempt.current ) {
			return;
		}

		popup.current = null;
		setIsSigningIn( false );

		if ( 'code' in result ) {
			submitOnSignIn.current = true;
			signedIn.value = { name: result.name, avatar: result.avatar, code: result.code };
		} else if ( 'error' in result ) {
			setSignInError(
				result.error === 'rate_limited' ? strings.signInRateLimited : strings.signInFailed
			);
		}
	};

	const update = ( field: keyof Commenter, value: string ) => {
		commenter.value = { ...commenter.value, [ field ]: value };
	};

	// Only while open: a required field the browser cannot focus would stop the submit that opens it.
	const required = requireNameEmail && isModalOpen.value;

	const fields = [
		{ field: 'author' as const, type: 'text', autoComplete: 'name', label: strings.name, required },
		{
			field: 'email' as const,
			type: 'email',
			autoComplete: 'email',
			label: strings.email,
			hint: strings.emailHint,
			required,
		},
		{ field: 'url' as const, type: 'url', autoComplete: 'url', label: strings.website },
	];

	const titleId = `jetpack-comments-dialog-title-${ formSettings.postId }`;

	return (
		<dialog
			ref={ dialog }
			className="jetpack-comments__dialog"
			aria-labelledby={ titleId }
			onClose={ () => ( isModalOpen.value = false ) }
		>
			<div className="jetpack-comments__dialog-header">
				{ site.iconUrl && (
					<img
						className="jetpack-comments__site-icon"
						src={ site.iconUrl }
						alt=""
						width="32"
						height="32"
					/>
				) }
				<span id={ titleId } className="jetpack-comments__dialog-title">
					{ site.name }
				</span>
				<button
					type="button"
					className="jetpack-comments__dialog-close"
					onClick={ () => ( isModalOpen.value = false ) }
				>
					<span className="jetpack-comments__visually-hidden">{ strings.close }</span>
					<CloseIcon />
				</button>
			</div>
			<p className="jetpack-comments__dialog-intro">
				{ mustLogIn ? strings.logInToComment : strings.intro }
			</p>
			{ ! mustLogIn && ! isLoggedIn && ! signedIn.value && (
				<div className="jetpack-comments__guest">
					{ fields.map( ( { field, hint, ...input } ) => (
						<div key={ field } className="jetpack-comments__guest-field">
							<label htmlFor={ field }>{ input.label }</label>
							<input
								id={ field }
								name={ field }
								type={ input.type }
								autoComplete={ input.autoComplete }
								required={ input.required }
								value={ commenter.value[ field ] }
								onInput={ event => update( field, event.currentTarget.value ) }
							/>
							{ hint && <span className="jetpack-comments__hint">{ hint }</span> }
						</div>
					) ) }
				</div>
			) }
			{ ! mustLogIn && formSettings.subscriptions.length > 0 && (
				<div className="jetpack-comments__subscriptions">
					{ formSettings.subscriptions.map( subscription => {
						const id = `jetpack-comments-${ subscription.name }-${ formSettings.postId }`;

						return (
							<label
								key={ subscription.name }
								className="jetpack-comments__checkbox"
								htmlFor={ id }
							>
								<input
									id={ id }
									type="checkbox"
									name={ subscription.name }
									value="subscribe"
									defaultChecked={ subscription.checked }
								/>
								<span>{ subscription.label }</span>
							</label>
						);
					} ) }
				</div>
			) }
			<div className="jetpack-comments__dialog-actions">
				{ ! mustLogIn && (
					<>
						<span className={ formSettings.submitWrapClass }>
							{ /* The label is what posts; core only checks that the consent field is set. */ }
							<input
								type="submit"
								name="wp-comment-cookies-consent"
								className={ formSettings.submitClass }
								value={ strings.saveAndPost }
							/>
						</span>
						<button type="submit" className="jetpack-comments__link-button">
							{ strings.postWithoutSaving }
						</button>
					</>
				) }
				{ identity.canSignIn && isSigningIn && (
					<span className="jetpack-comments__signing-in">
						<span className="jetpack-comments__spinner" aria-hidden="true" />
						<button type="button" className="jetpack-comments__link-button" onClick={ cancel }>
							{ strings.cancel }
						</button>
					</span>
				) }
				{ identity.canSignIn && ! isSigningIn && (
					<span className="jetpack-comments__sign-in">
						<button
							type="button"
							className="jetpack-comments__link-button jetpack-comments__wpcom"
							onClick={ start }
						>
							<WordPressIcon />
							{ strings.logInWithWordPress }
						</button>
						{ signInError && (
							<span className="jetpack-comments__notice" role="status">
								{ signInError }
							</span>
						) }
					</span>
				) }
			</div>
		</dialog>
	);
};

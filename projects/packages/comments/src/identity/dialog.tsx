import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { signIn } from './checkpoint/checkpoint';
import { CloseIcon, WordPressIcon } from './icons';
import type { Commenter } from '../shared/types';

import './style.scss';

/**
 * Asks a reader who they are on their way to posting, and which subscriptions
 * they want where the host offers any.
 *
 * It sits inside the form, so its fields post with the comment. For a guest,
 * "Save and post" is the submit button carrying core's cookies-consent field
 * and "No, thanks" submits without it, so core clears any saved details. A
 * reader the site knows gets one plain submit.
 *
 * @return The dialog.
 */
export const IdentityDialog = () => {
	const { formSettings, commenter, commentParent, signedIn, isModalOpen } =
		useContext( CommentSignals );
	const { site, strings, user, isLoggedIn, mustLogIn, requireNameEmail, identity } =
		JetpackComments;
	const dialog = useRef< HTMLDialogElement >( null );
	const popup = useRef< Window | null >( null );
	// Bumped per sign-in, so a popup closed to open another cannot answer for it.
	const attempt = useRef( 0 );
	const [ isSigningIn, setIsSigningIn ] = useState( false );
	const [ signInError, setSignInError ] = useState( '' );

	useEffect( () => {
		const element = dialog.current;

		if ( isModalOpen.value && ! element?.open ) {
			// Transparent where the theme paints a wrapper instead; the stylesheet's Canvas stands in.
			const surface = getComputedStyle( document.body ).backgroundColor;
			element!.style.backgroundColor = surface === 'rgba(0, 0, 0, 0)' ? '' : surface;
			element!.showModal();
		} else if ( ! isModalOpen.value && element?.open ) {
			element.close();
		}
	}, [ isModalOpen.value ] );

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

	// Drawn in the Jetpack Forms markup, so the forms stylesheet and the theme
	// style these exactly as they do a Form block.
	const fields = [
		{ field: 'author' as const, kind: 'name', type: 'text', label: strings.name, required },
		{
			field: 'email' as const,
			kind: 'email',
			type: 'email',
			label: strings.email,
			hint: strings.emailHint,
			required,
		},
		{ field: 'url' as const, kind: 'url', type: 'url', label: strings.website },
	];

	const titleId = `jetpack-comments-dialog-title-${ formSettings.postId }`;
	const known = isLoggedIn || signedIn.value !== null;
	const name = user ? user.name : ( signedIn.value?.name ?? '' );
	const submitLabel = commentParent.value ? strings.reply : formSettings.submitLabel;

	const signInBlock = ! known && identity.canSignIn && (
		<div className="jetpack-comments__sign-in">
			{ isSigningIn ? (
				<span className="jetpack-comments__signing-in">
					<span className="jetpack-comments__spinner" aria-hidden="true" />
					<button type="button" className="jetpack-comments__link-button" onClick={ cancel }>
						{ strings.cancel }
					</button>
				</span>
			) : (
				<button type="button" className="jetpack-comments__wpcom" onClick={ start }>
					<WordPressIcon />
					{ strings.logInWithWordPress }
				</button>
			) }
			{ signInError && (
				<span className="jetpack-comments__notice" role="status">
					{ signInError }
				</span>
			) }
		</div>
	);

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
			{ ! known && mustLogIn && (
				<p className="jetpack-comments__dialog-intro">{ strings.mustLogIn }</p>
			) }
			{ signInBlock }
			{ known && (
				<p className="jetpack-comments__dialog-intro">
					{ strings.commentingAs.replace( '%s', () => name ) }
				</p>
			) }
			{ ! known && ! mustLogIn && (
				<p className="jetpack-comments__dialog-intro">
					{ identity.canSignIn ? strings.introOr : strings.intro }
				</p>
			) }
			{ ! mustLogIn && ! known && (
				<div className="contact-form jetpack-comments__guest">
					{ fields.map( ( { field, kind, hint, ...input } ) => (
						<div
							key={ field }
							className={ `wp-block-jetpack-field-${ kind } grunion-field-${ kind }-wrap wp-block-jetpack-input-wrap grunion-field-wrap` }
						>
							<label
								htmlFor={ field }
								className={ `grunion-field-label ${ kind } wp-block-jetpack-label` }
							>
								{ input.label }
								{ input.required && (
									<span className="grunion-label-required" aria-hidden="true">
										{ strings.required }
									</span>
								) }
							</label>
							<input
								id={ field }
								name={ field }
								type={ input.type }
								autoComplete={ kind }
								className={ `${ kind } wp-block-jetpack-input grunion-field` }
								required={ input.required }
								value={ commenter.value[ field ] }
								onInput={ event => update( field, event.currentTarget.value ) }
							/>
							{ hint && <span className="jetpack-comments__hint">{ hint }</span> }
						</div>
					) ) }
				</div>
			) }
			{ ( known || ! mustLogIn ) && formSettings.subscriptions.length > 0 && (
				<div className="contact-form jetpack-comments__subscriptions">
					{ formSettings.subscriptions.map( subscription => {
						const id = `jetpack-comments-${ subscription.name }-${ formSettings.postId }`;

						return (
							<div
								key={ subscription.name }
								className="wp-block-jetpack-field-checkbox is-style-list grunion-field-checkbox-wrap wp-block-jetpack-option-wrap grunion-field-wrap"
							>
								<div className="contact-form__checkbox-wrap">
									<input
										id={ id }
										type="checkbox"
										name={ subscription.name }
										value="subscribe"
										className="checkbox wp-block-jetpack-option grunion-field"
										defaultChecked={ subscription.checked }
									/>
									<label
										htmlFor={ id }
										className="grunion-field-label checkbox wp-block-jetpack-option"
									>
										{ subscription.label }
									</label>
								</div>
							</div>
						);
					} ) }
				</div>
			) }
			<div className="jetpack-comments__dialog-actions">
				{ known && (
					<span className={ formSettings.submitWrapClass }>
						<input type="submit" className={ formSettings.submitClass } value={ submitLabel } />
					</span>
				) }
				{ ! known && ! mustLogIn && (
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
			</div>
		</dialog>
	);
};

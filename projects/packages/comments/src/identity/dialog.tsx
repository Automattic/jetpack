import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { emailHasAccount, signIn } from './checkpoint/checkpoint';
import { CloseIcon, WordPressIcon } from './icons';

import './dialog.scss';

/**
 * Asks a reader who they are on their way to posting, plus any subscribe options
 * the host offers. A saved guest opens it alone to edit their details.
 *
 * It sits inside the form, so its fields post with the comment. "Save and post"
 * carries core's cookies-consent field and "No, thanks" does not, so core clears
 * any saved details on the latter.
 *
 * @return The dialog.
 */
export const IdentityDialog = () => {
	const { formSettings, commenter, commentParent, signedIn, isKnown, isDialogOpen, isEditing } =
		useContext( CommentSignals );
	const { site, strings, user, mustLogIn, requireNameEmail, identity } = JetpackComments;
	const dialog = useRef< HTMLDialogElement >( null );
	const popup = useRef< Window | null >( null );
	// Bumped per attempt, so a popup or request abandoned for another cannot answer for it.
	const signInAttempt = useRef( 0 );
	const emailAttempt = useRef( 0 );
	const emailTimer = useRef( 0 );
	const [ isSigningIn, setIsSigningIn ] = useState( false );
	const [ signInError, setSignInError ] = useState( '' );
	const [ emailTaken, setEmailTaken ] = useState( false );
	const [ checkingEmail, setCheckingEmail ] = useState( false );

	useEffect( () => {
		const element = dialog.current;

		if ( isDialogOpen.value && ! element?.open ) {
			// The page's own surface; the stylesheet's Canvas stands in where the body is transparent.
			const surface = getComputedStyle( document.body ).backgroundColor;
			element!.style.backgroundColor = surface === 'rgba(0, 0, 0, 0)' ? '' : surface;
			element!.showModal();
		} else if ( ! isDialogOpen.value && element?.open ) {
			element.close();
		}
	}, [ isDialogOpen.value ] );

	const start = async () => {
		setSignInError( '' );
		setIsSigningIn( true );

		const current = ++signInAttempt.current;
		const result = await signIn( opened => {
			popup.current = opened;
		} );

		if ( current !== signInAttempt.current ) {
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

	const checkEmail = async ( email: string ) => {
		const current = ++emailAttempt.current;
		window.clearTimeout( emailTimer.current );

		if ( ! /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test( email ) ) {
			setEmailTaken( false );
			setCheckingEmail( false );
			return;
		}

		setCheckingEmail( true );
		const taken = await emailHasAccount( email );

		if ( current === emailAttempt.current ) {
			setEmailTaken( taken );
			setCheckingEmail( false );
		}
	};

	// Writes the cookies core would on the next comment, so an edit outlives the page.
	const save = () => {
		const { cookieHash, cookiePath, cookieDomain } = identity;
		const expires = new Date( Date.now() + 365 * 24 * 60 * 60 * 1000 ).toUTCString();
		const suffix = `; expires=${ expires }; path=${ cookiePath || '/' }${
			cookieDomain ? `; domain=${ cookieDomain }` : ''
		}; SameSite=Lax${ window.location.protocol === 'https:' ? '; Secure' : '' }`;
		const { author, email, url } = commenter.value;

		document.cookie = `comment_author_${ cookieHash }=${ encodeURIComponent( author ) }${ suffix }`;
		document.cookie = `comment_author_email_${ cookieHash }=${ encodeURIComponent( email ) }${ suffix }`;
		document.cookie = `comment_author_url_${ cookieHash }=${ encodeURIComponent( url ) }${ suffix }`;

		isDialogOpen.value = false;
	};

	const close = () => {
		isDialogOpen.value = false;
		isEditing.value = false;
	};

	// Only while open: a required field the browser cannot focus would stop the submit that opens it.
	const required = requireNameEmail && isDialogOpen.value;

	// Core's own comment-form markup, so a theme's styles for it reach these too.
	const fields = [
		{ field: 'author' as const, type: 'text', autoComplete: 'name', label: strings.name, required },
		{
			field: 'email' as const,
			type: 'email',
			autoComplete: 'email',
			label: strings.email,
			required,
		},
		{ field: 'url' as const, type: 'url', autoComplete: 'url', label: strings.website },
	];

	const titleId = `jetpack-comments-dialog-title-${ formSettings.postId }`;
	const editing = isEditing.value;
	const known = ! editing && isKnown.value;
	const showFields = ! known && ! mustLogIn;
	const holdButtons = emailTaken || checkingEmail;
	const { submit } = formSettings;

	return (
		<dialog
			ref={ dialog }
			className="jetpack-comments__dialog"
			aria-labelledby={ titleId }
			onClose={ close }
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
				<button type="button" className="jetpack-comments__dialog-close" onClick={ close }>
					<span className="jetpack-comments__visually-hidden">{ strings.close }</span>
					<CloseIcon />
				</button>
			</div>
			{ ! known && mustLogIn && (
				<p className="jetpack-comments__dialog-intro">{ strings.mustLogIn }</p>
			) }
			{ ! known && identity.canSignIn && (
				<div className="jetpack-comments__sign-in">
					{ isSigningIn ? (
						<span className="jetpack-comments__signing-in">
							<span className="jetpack-comments__spinner" aria-hidden="true" />
							<button
								type="button"
								className="jetpack-comments__link-button"
								onClick={ () => {
									signInAttempt.current++;
									popup.current?.close();
									popup.current = null;
									setIsSigningIn( false );
								} }
							>
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
			) }
			{ known && (
				<p className="jetpack-comments__dialog-intro">
					{ strings.commentingAs.replace(
						'%s',
						() => user?.name ?? signedIn.value?.name ?? commenter.value.author
					) }
				</p>
			) }
			{ showFields && ! editing && (
				<p className="jetpack-comments__dialog-intro">
					{ identity.canSignIn ? strings.introOr : strings.intro }
				</p>
			) }
			{ showFields &&
				fields.map( ( { field, ...input } ) => (
					<p key={ field } className={ `comment-form-${ field }` }>
						<label htmlFor={ field }>
							{ input.label }
							{ input.required && (
								<>
									{ ' ' }
									<span className="required" aria-hidden="true">
										*
									</span>
								</>
							) }
						</label>
						<input
							id={ field }
							name={ field }
							type={ input.type }
							autoComplete={ input.autoComplete }
							aria-describedby={ field === 'email' ? 'email-notes' : undefined }
							aria-invalid={ field === 'email' && emailTaken ? 'true' : undefined }
							required={ input.required }
							value={ commenter.value[ field ] }
							onInput={ event => {
								const { value } = event.currentTarget;
								commenter.value = { ...commenter.value, [ field ]: value };

								if ( field === 'email' ) {
									window.clearTimeout( emailTimer.current );
									emailTimer.current = window.setTimeout( () => checkEmail( value ), 500 );
								}
							} }
							onBlur={ field === 'email' ? () => checkEmail( commenter.value.email ) : undefined }
						/>
						{ field === 'email' && (
							<span id="email-notes" className="comment-notes">
								{ strings.emailHint }
							</span>
						) }
						{ field === 'email' && emailTaken && (
							<span className="jetpack-comments__notice" role="alert">
								{ strings.emailHasAccount }
							</span>
						) }
					</p>
				) ) }
			{ ! editing &&
				( known || ! mustLogIn ) &&
				formSettings.subscriptions.map( subscription => {
					const id = `jetpack-comments-${ subscription.name }-${ formSettings.postId }`;

					// Jetpack Subscriptions' own markup, for the same reason.
					return (
						<p key={ subscription.name } className="comment-subscription-form">
							<input
								id={ id }
								type="checkbox"
								name={ subscription.name }
								value="subscribe"
								defaultChecked={ subscription.checked }
							/>{ ' ' }
							<label htmlFor={ id } className="subscribe-label">
								{ subscription.label }
							</label>
						</p>
					);
				} ) }
			<div className="jetpack-comments__dialog-actions">
				{ editing && (
					<span className={ submit.wrapClass }>
						<button
							type="button"
							className={ submit.class }
							disabled={ holdButtons }
							onClick={ save }
						>
							{ strings.save }
						</button>
					</span>
				) }
				{ known && (
					<span className={ submit.wrapClass }>
						<input
							type="submit"
							className={ submit.class }
							value={ commentParent.value ? strings.reply : submit.label }
						/>
					</span>
				) }
				{ showFields && ! editing && (
					<>
						<span className={ submit.wrapClass }>
							{ /* The label is what posts; core only checks that the field is set. */ }
							<input
								type="submit"
								name="wp-comment-cookies-consent"
								className={ submit.class }
								disabled={ holdButtons }
								value={ strings.saveAndPost }
							/>
						</span>
						<button
							type="submit"
							className="jetpack-comments__link-button"
							disabled={ holdButtons }
						>
							{ strings.postWithoutSaving }
						</button>
					</>
				) }
			</div>
		</dialog>
	);
};

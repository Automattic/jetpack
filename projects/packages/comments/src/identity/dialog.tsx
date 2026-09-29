import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { emailHasAccount, signIn } from './checkpoint/checkpoint';
import { CloseIcon, WordPressIcon } from './icons';
import { Toggle } from './toggle';

import './dialog.scss';

/**
 * The dialog's host, a form control, so the dialog can live in a shadow root out
 * of the theme's reach and still post with the comment.
 */
export class DialogHost extends HTMLElement {
	static formAssociated = true;
	internals = this.attachInternals();
}

/**
 * Asks a reader who they are on their way to posting, plus any subscribe options
 * the host offers. A saved guest opens it alone to edit their details.
 *
 * A form leaves out fields in a shadow root, so this hands the comment form what
 * to post through its host instead. A guest's "Save and post" adds core's
 * cookies-consent field, so core saves their details.
 *
 * @param props           - Component props.
 * @param props.internals - The host's form internals.
 * @return The dialog.
 */
export const IdentityDialog = ( { internals }: { internals: ElementInternals } ) => {
	const {
		formSettings,
		commenter,
		isEmptyComment,
		signedIn,
		isSavedGuest,
		isKnown,
		isDialogOpen,
		isEditing,
	} = useContext( CommentSignals );
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
	// Straight to the fields when they are the only way through.
	const firstStep = identity.canSignIn || ! requireNameEmail ? 'choose' : 'guest';
	const [ step, setStep ] = useState( firstStep );
	const [ subscribed, setSubscribed ] = useState< Record< string, boolean > >( () =>
		Object.fromEntries(
			formSettings.subscriptions.map( ( { name, checked } ) => [ name, checked ] )
		)
	);

	useEffect( () => {
		const element = dialog.current;

		if ( isDialogOpen.value && ! element?.open ) {
			setStep( firstStep );
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
			isDialogOpen.value = false;

			// A timeout, so the render that puts the sign-in code in the form lands first.
			if ( ! isEmptyComment.peek() ) {
				window.setTimeout( () => internals.form?.requestSubmit() );
			}
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
			return;
		}

		const taken = await emailHasAccount( email );

		if ( current === emailAttempt.current ) {
			setEmailTaken( taken );
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

	const fields = [
		{
			field: 'author' as const,
			type: 'text',
			autoComplete: 'name',
			label: strings.name,
			required: requireNameEmail,
		},
		{
			field: 'email' as const,
			type: 'email',
			autoComplete: 'email',
			label: strings.email,
			required: requireNameEmail,
		},
		{ field: 'url' as const, type: 'url', autoComplete: 'url', label: strings.website },
	];

	const editing = isEditing.value;
	const known = ! editing && isKnown.value;
	const choosing = ! known && ! editing && step === 'choose';
	const showFields = ! known && ! mustLogIn && ( editing || step === 'guest' );
	const showToggles = showFields && ! editing;
	const guest = ! user && ! signedIn.value && ! mustLogIn;
	const posting = ! isEmptyComment.value;

	const formValue = ( consent: boolean, anonymous = false ) => {
		const data = new FormData();

		if ( anonymous ) {
			return data;
		}

		if ( guest ) {
			Object.entries( commenter.value ).forEach( ( [ name, value ] ) =>
				data.append( name, value )
			);
		}

		if ( showToggles ) {
			formSettings.subscriptions.forEach(
				( { name } ) => subscribed[ name ] && data.append( name, 'subscribe' )
			);
		}

		if ( consent ) {
			data.append( 'wp-comment-cookies-consent', 'yes' );
		}

		return data;
	};

	useEffect( () => internals.setFormValue( formValue( false ) ) );

	const submit = ( event: Event ) => {
		event.preventDefault();

		// Opened from "Add your name" with nothing written, so there is nothing to post.
		if ( editing || isEmptyComment.peek() ) {
			save();
			isSavedGuest.value = commenter.value.author !== '' && commenter.value.email !== '';
			return;
		}

		const { submitter } = event as SubmitEvent;

		const action = submitter?.getAttribute( 'name' );

		// Read as the comment form submits, then dropped, so a blocked submit leaves no consent behind.
		internals.setFormValue( formValue( action === 'consent', action === 'anonymous' ) );
		internals.form?.requestSubmit();
		internals.setFormValue( formValue( false ) );
	};

	return (
		<>
			<link rel="stylesheet" href={ JetpackComments.styleUrl } />
			<dialog
				ref={ dialog }
				className="jetpack-comments__dialog"
				aria-labelledby="title"
				onClose={ close }
			>
				<form onSubmit={ submit }>
					<div className="jetpack-comments__dialog-header">
						{ site.iconUrl && (
							<img
								className="jetpack-comments__site-icon"
								src={ site.iconUrl }
								alt=""
								width="36"
								height="36"
							/>
						) }
						<span id="title" className="jetpack-comments__dialog-title">
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
					{ choosing && (
						<div className="jetpack-comments__sign-in">
							{ identity.canSignIn &&
								( isSigningIn ? (
									<span className="jetpack-comments__signing-in">
										<span className="jetpack-comments__spinner" aria-hidden="true" />
										<button
											type="button"
											className="jetpack-comments__button is-link"
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
								) ) }
							{ signInError && (
								<span className="jetpack-comments__notice" role="status">
									{ signInError }
								</span>
							) }
							{ ! mustLogIn && (
								<button
									type="button"
									className="jetpack-comments__button is-secondary"
									onClick={ () => setStep( 'guest' ) }
								>
									{ strings.continueAsGuest }
								</button>
							) }
							{ posting && ! mustLogIn && ! requireNameEmail && (
								<button type="submit" name="anonymous" className="jetpack-comments__button is-link">
									{ strings.postWithoutSaving }
								</button>
							) }
						</div>
					) }
					{ showFields && ! editing && (
						<>
							<h2 className="jetpack-comments__dialog-heading">{ strings.createProfile }</h2>
							<p className="jetpack-comments__dialog-intro">{ strings.intro }</p>
						</>
					) }
					{ showFields &&
						fields.map( ( { field, ...input } ) => (
							<div key={ field } className="jetpack-comments__field">
								<label htmlFor={ field } className="jetpack-comments__label">
									{ input.label }
								</label>
								<input
									id={ field }
									name={ field }
									type={ input.type }
									autoComplete={ input.autoComplete }
									className="jetpack-comments__input"
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
									onBlur={
										field === 'email' ? () => checkEmail( commenter.value.email ) : undefined
									}
								/>
								{ field === 'email' && (
									<span id="email-notes" className="jetpack-comments__help">
										{ strings.emailHint }
									</span>
								) }
								{ field === 'email' && emailTaken && (
									<span className="jetpack-comments__notice" role="alert">
										{ strings.emailHasAccount }
									</span>
								) }
							</div>
						) ) }
					{ showToggles &&
						formSettings.subscriptions.map( ( { name, label } ) => (
							<Toggle
								key={ name }
								id={ name }
								checked={ subscribed[ name ] }
								onChange={ checked => setSubscribed( { ...subscribed, [ name ]: checked } ) }
								label={ label }
							/>
						) ) }
					<div className="jetpack-comments__dialog-actions">
						{ editing && (
							<button
								type="submit"
								className="jetpack-comments__button is-primary"
								disabled={ emailTaken }
							>
								{ strings.save }
							</button>
						) }
						{ showFields && ! editing && (
							<>
								{ /* First, so Enter in a field submits with consent. */ }
								<button
									type="submit"
									name="consent"
									className="jetpack-comments__button is-primary"
									disabled={ emailTaken }
								>
									{ posting ? strings.saveAndPost : strings.save }
								</button>
								{ firstStep === 'choose' && (
									<button
										type="button"
										className="jetpack-comments__button is-link"
										onClick={ () => setStep( 'choose' ) }
									>
										{ strings.back }
									</button>
								) }
							</>
						) }
					</div>
				</form>
			</dialog>
		</>
	);
};

import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { emailHasAccount, signIn } from './checkpoint/checkpoint';
import './dialog.scss';
import './toggle.scss';

/**
 * The dialog's host, a form control, so the dialog can live in a shadow root out
 * of the theme's reach and still post with the comment.
 */
export class DialogHost extends HTMLElement {
	static formAssociated = true;
	internals = this.attachInternals();
}

/**
 * Asks a commenter who they are on their way to posting, plus any subscribe options
 * the host offers. A saved guest opens it alone to edit their details.
 *
 * A form leaves out fields in a shadow root, so this hands the comment form what
 * to post through its host instead. The save switch adds core's cookies-consent
 * field, so core keeps a guest's details.
 *
 * @param props           - Component props.
 * @param props.internals - The host's form internals.
 * @return The dialog.
 */
export const Dialog = ( { internals }: { internals: ElementInternals } ) => {
	const {
		formSettings,
		details,
		isEmptyComment,
		commentParent,
		commenter,
		rememberDetails,
		isDialogOpen,
		isEditingDetails,
	} = useContext( CommentSignals );
	const { site, strings, mustLogIn, requireNameEmail, cookiesOptIn, identity } = JetpackComments;
	const dialog = useRef< HTMLDialogElement >( null );
	const popup = useRef< Window | null >( null );
	// Bumped per attempt, so a popup or request abandoned for another cannot answer for it.
	const signInAttempt = useRef( 0 );
	const emailAttempt = useRef( 0 );
	const emailTimer = useRef( 0 );
	const checkedEmail = useRef( '' );
	const turnedPage = useRef( false );
	const [ isSigningIn, setIsSigningIn ] = useState( false );
	const [ signInError, setSignInError ] = useState( '' );
	const [ emailTaken, setEmailTaken ] = useState( false );
	// Straight to the fields when they are the only way through.
	const firstStep = identity.canSignIn ? 'choose' : 'guest';
	const [ step, setStep ] = useState< 'choose' | 'guest' | 'subscribe' >( firstStep );
	const [ subscribed, setSubscribed ] = useState< Record< string, boolean > >( () =>
		Object.fromEntries(
			formSettings.subscriptions.map( ( { name, checked } ) => [ name, checked ] )
		)
	);

	// Subscribe options are offered once, when a reader logs in or gives their email. A choice
	// made with nothing to post waits here for their next comment, then is gone.
	const [ heldChoice, setHeldChoice ] = useState< string[] | null >( null );
	// Whether what the form will post right now carries a choice.
	const sendsChoice = useRef( false );

	useEffect( () => {
		const element = dialog.current;

		if ( isDialogOpen.value && ! element?.open ) {
			setStep( firstStep );
			element!.showModal();
		} else if ( ! isDialogOpen.value && element?.open ) {
			element.close();
		}
	}, [ isDialogOpen.value ] );

	// The button that turned the page is gone, so focus goes to the new page's first control.
	useEffect( () => {
		if ( turnedPage.current ) {
			turnedPage.current = false;
			dialog.current
				?.querySelector< HTMLElement >( 'input, .jetpack-comments__sign-in button' )
				?.focus();
		}
	}, [ step ] );

	const turnPage = ( next: typeof step ) => {
		turnedPage.current = true;
		setStep( next );
	};

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
			commenter.value = {
				kind: 'wordpress',
				name: result.name,
				avatar: result.avatar,
				code: result.code,
			};

			if ( formSettings.subscriptions.length ) {
				turnedPage.current = true;
				setStep( 'subscribe' );
				return;
			}

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
			checkedEmail.current = '';
			setEmailTaken( false );
			return;
		}

		// Each check counts against a rate limit, and leaving the field re-checks what typing just did.
		if ( email === checkedEmail.current ) {
			return;
		}

		checkedEmail.current = email;

		const taken = await emailHasAccount( email );

		if ( current === emailAttempt.current ) {
			setEmailTaken( taken );
		}
	};

	const close = () => {
		isDialogOpen.value = false;
		isEditingDetails.value = false;
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

	const editing = isEditingDetails.value;
	const known = ! editing && commenter.value.kind !== 'unknown';
	const choosing = ! known && ! editing && step === 'choose';
	const showFields = ! known && ! mustLogIn && ( editing || step === 'guest' );
	const showToggles =
		formSettings.subscriptions.length > 0 &&
		isDialogOpen.value &&
		! editing &&
		( step === 'subscribe' || ( showFields && step === 'guest' ) );
	const chosen = formSettings.subscriptions
		.filter( ( { name } ) => subscribed[ name ] )
		.map( ( { name } ) => name );
	const guest =
		( commenter.value.kind === 'guest' || commenter.value.kind === 'unknown' ) && ! mustLogIn;
	const posting = ! isEmptyComment.value;

	const formValue = ( consent: boolean ) => {
		const data = new FormData();

		if ( guest ) {
			Object.entries( details.value ).forEach( ( [ name, value ] ) => data.append( name, value ) );
		}

		// Chosen here, or held from when they saved their details with nothing to post.
		const choice = showToggles ? chosen : heldChoice;

		choice?.forEach( name => data.append( name, 'subscribe' ) );
		sendsChoice.current = choice !== null;

		if ( consent ) {
			data.append( 'wp-comment-cookies-consent', 'yes' );
		}

		return data;
	};

	useEffect( () => internals.setFormValue( formValue( false ) ) );

	// The comment that carries a held choice uses it up. Runs after the form's own
	// listener, which cancels the submit that only opens this dialog, and clears a
	// tick later: the browser reads the form's fields after this event, not before.
	useEffect( () => {
		const form = internals.form;
		const onSubmit = ( event: SubmitEvent ) => {
			if ( ! event.defaultPrevented && sendsChoice.current ) {
				window.setTimeout( () => setHeldChoice( null ) );
			}
		};

		form?.addEventListener( 'submit', onSubmit );

		return () => form?.removeEventListener( 'submit', onSubmit );
	}, [ internals ] );

	const submit = ( event: Event ) => {
		event.preventDefault();

		// Opened from "Add your name" with nothing written, so there is nothing to post.
		if ( editing || isEmptyComment.peek() ) {
			if ( showToggles ) {
				setHeldChoice( chosen );
			}

			if ( step === 'subscribe' ) {
				isDialogOpen.value = false;
				return;
			}

			// The cookies core writes with consent, or clears without it, as it would on a comment.
			const { cookieHash, cookiePath, cookieDomain } = identity;
			const expires = new Date(
				rememberDetails.peek() ? Date.now() + 365 * 24 * 60 * 60 * 1000 : 0
			).toUTCString();
			const suffix = `; expires=${ expires }; path=${ cookiePath || '/' }${
				cookieDomain ? `; domain=${ cookieDomain }` : ''
			}; SameSite=Lax${ window.location.protocol === 'https:' ? '; Secure' : '' }`;
			const { author, email, url } = details.value;

			document.cookie = `comment_author_${ cookieHash }=${ encodeURIComponent( author ) }${ suffix }`;
			document.cookie = `comment_author_email_${ cookieHash }=${ encodeURIComponent( email ) }${ suffix }`;
			document.cookie = `comment_author_url_${ cookieHash }=${ encodeURIComponent( url ) }${ suffix }`;

			isDialogOpen.value = false;
			commenter.value =
				details.value.author !== '' && details.value.email !== ''
					? { kind: 'guest' }
					: { kind: 'unknown' };
			return;
		}

		// Read as the comment form submits, then dropped, so a blocked submit leaves no consent behind.
		internals.setFormValue( formValue( showFields && rememberDetails.peek() ) );
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
							{ /* @wordpress/icons "close". */ }
							<svg
								viewBox="0 0 24 24"
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								aria-hidden="true"
								focusable="false"
							>
								<path d="M5 19L19 5M19 19L5 5" vectorEffect="non-scaling-stroke" />
							</svg>
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
										<svg
											width="16"
											height="16"
											viewBox="0 0 20 20"
											fill="none"
											aria-hidden="true"
											focusable="false"
										>
											<path
												fill-rule="evenodd"
												clip-rule="evenodd"
												d="M19.2308 9.99981C19.2308 4.91366 15.0862 0.769043 10.0001 0.769043C4.90467 0.769043 0.769287 4.91366 0.769287 9.99981C0.769287 15.0952 4.90467 19.2306 10.0001 19.2306C15.0862 19.2306 19.2308 15.0952 19.2308 9.99981ZM7.95083 14.9567L4.80313 6.51058C5.31083 6.49212 5.88313 6.43674 5.88313 6.43674C6.34467 6.38135 6.28929 5.39366 5.82775 5.41212C5.82775 5.41212 4.48929 5.51366 3.64006 5.51366C3.4739 5.51366 3.29852 5.51366 3.10467 5.50443C4.57236 3.25212 7.11083 1.79366 10.0001 1.79366C12.1508 1.79366 14.1077 2.59674 15.5847 3.95366C14.957 3.85212 14.0616 4.31366 14.0616 5.41212C14.0616 6.01026 14.3801 6.52347 14.7382 7.10048C14.7891 7.18242 14.8407 7.26565 14.8924 7.35058C15.2154 7.91366 15.4001 8.60597 15.4001 9.62135C15.4001 10.9967 14.1077 14.2367 14.1077 14.2367L11.3108 6.51058C11.8093 6.49212 12.0677 6.35366 12.0677 6.35366C12.5293 6.3075 12.4739 5.19981 12.0124 5.2275C12.0124 5.2275 10.6831 5.33827 9.81544 5.33827C9.01236 5.33827 7.66467 5.2275 7.66467 5.2275C7.20313 5.19981 7.14775 6.3352 7.60929 6.35366L8.45852 6.4275L9.62159 9.5752L7.95083 14.9567ZM16.8602 9.94619L16.8401 9.99981C16.1713 11.7605 15.5075 13.5364 14.8451 15.3087L14.845 15.309L14.8448 15.3093C14.6113 15.9341 14.378 16.5583 14.1447 17.1814C16.6093 15.7598 18.2062 13.0367 18.2062 9.99981C18.2062 8.57827 17.8831 7.2675 17.237 6.07674C17.5147 8.20894 17.0881 9.34123 16.8602 9.94617L16.8602 9.94619ZM6.40006 17.4675C3.64929 16.1383 1.7939 13.2583 1.7939 9.99981C1.7939 8.79981 2.00621 7.71058 2.45852 6.68597L3.28801 8.95912C4.32263 11.7949 5.35847 14.6341 6.40006 17.4675ZM12.5016 17.7906L10.1201 11.3475C9.68129 12.6419 9.23927 13.9362 8.79593 15.2344C8.4931 16.1212 8.18965 17.0097 7.88621 17.9014C8.55083 18.1044 9.27083 18.206 10.0001 18.206C10.877 18.206 11.7077 18.0583 12.5016 17.7906Z"
												fill="currentColor"
											/>
										</svg>
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
									onClick={ () => turnPage( 'guest' ) }
								>
									{ strings.continueAsGuest }
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
									value={ details.value[ field ] }
									onInput={ event => {
										const { value } = event.currentTarget;
										details.value = { ...details.value, [ field ]: value };

										if ( field === 'email' ) {
											window.clearTimeout( emailTimer.current );
											emailTimer.current = window.setTimeout( () => checkEmail( value ), 500 );
										}
									} }
									onBlur={ field === 'email' ? () => checkEmail( details.value.email ) : undefined }
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
					{ showFields && cookiesOptIn && (
						<label htmlFor="remember" className="jetpack-comments__toggle">
							<input
								id="remember"
								type="checkbox"
								role="switch"
								checked={ rememberDetails.value }
								onChange={ event => ( rememberDetails.value = event.currentTarget.checked ) }
							/>
							<span className="jetpack-comments__toggle-text">{ strings.saveDetails }</span>
						</label>
					) }
					{ showToggles &&
						formSettings.subscriptions.map( ( { name, label } ) => (
							<label key={ name } htmlFor={ name } className="jetpack-comments__toggle">
								<input
									id={ name }
									type="checkbox"
									role="switch"
									checked={ subscribed[ name ] }
									onChange={ event =>
										setSubscribed( { ...subscribed, [ name ]: event.currentTarget.checked } )
									}
								/>
								<span className="jetpack-comments__toggle-text">{ label }</span>
							</label>
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
						{ step === 'subscribe' && known && (
							<button type="submit" className="jetpack-comments__button is-primary">
								{ ! posting && strings.save }
								{ posting && ( commentParent.value ? strings.reply : formSettings.submit.label ) }
							</button>
						) }
						{ showFields && ! editing && (
							<>
								<button
									type="submit"
									className="jetpack-comments__button is-primary"
									disabled={ emailTaken }
								>
									{ ! posting && strings.save }
									{ posting && ( commentParent.value ? strings.reply : formSettings.submit.label ) }
								</button>
								{ firstStep === 'choose' && (
									<button
										type="button"
										className="jetpack-comments__button is-link"
										onClick={ () => turnPage( 'choose' ) }
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

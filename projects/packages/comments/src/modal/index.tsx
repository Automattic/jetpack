import clsx from 'clsx';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { emailHasAccount, signIn } from '../shared/checkpoint';
import { saveGuest } from '../shared/guest';
import { CommentSignals } from '../shared/state';
import { DetailsFields } from './details-fields';
import { Header } from './header';
import { LogIn } from './log-in';
import { SubscribeSwitches } from './subscribe-switches';
import type { SignInStatus, Step, Subscribed } from './types';

import './style.scss';

const isEmail = ( email: string ) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test( email );

/**
 * Asks a commenter who they are on their way to posting, or lets a guest change their
 * details, plus any subscribe options the host offers.
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
		isPosting,
		forget,
	} = useContext( CommentSignals );
	const { strings, mustLogIn, requireNameEmail, identity } = JetpackComments;
	const dialog = useRef< HTMLDialogElement >( null );
	const popup = useRef< Window | null >( null );
	const opener = useRef< Element | null >( null );
	const [ signInStatus, setSignInStatus ] = useState< SignInStatus >( 'idle' );
	const [ emailTaken, setEmailTaken ] = useState( false );
	const [ checkingEmail, setCheckingEmail ] = useState( false );
	// One request per address, shared by the debounced check and a submit that beats it.
	const emailCheck = useRef< { email: string; taken: Promise< boolean | null > } | null >( null );
	// Straight to the fields when they are the only way through, or a saved guest is changing them.
	const firstStep = identity.canSignIn && commenter.value.kind !== 'guest' ? 'choose' : 'guest';
	const [ step, setStep ] = useState< Step >( firstStep );
	const defaultSubscribed = () =>
		Object.fromEntries(
			formSettings.subscriptions.map( ( { name, checked } ) => [ name, checked ] )
		);
	const [ subscribed, setSubscribed ] = useState< Subscribed >( defaultSubscribed );
	// Choices saved without a comment, which post with the next one.
	const [ saved, setSaved ] = useState< Subscribed | null >( null );
	const posting = ! isEmptyComment.value;

	const showFields = step === 'guest';
	const showToggles =
		formSettings.subscriptions.length > 0 &&
		isDialogOpen.value &&
		( step === 'guest' || step === 'subscribe' );
	const chosen = formSettings.subscriptions
		.filter( ( { name } ) => subscribed[ name ] )
		.map( ( { name } ) => name );
	const guest =
		( commenter.value.kind === 'guest' || commenter.value.kind === 'unknown' ) && ! mustLogIn;
	const enteredEmail = details.value.email;
	const checkEmail = async ( email: string ) => {
		if ( emailCheck.current?.email !== email ) {
			emailCheck.current = { email, taken: emailHasAccount( email ) };
		}

		const { taken } = emailCheck.current;
		const answer = await taken;

		// A check that got no answer is asked again next time, not kept as a no.
		if ( answer === null && emailCheck.current?.taken === taken ) {
			emailCheck.current = null;
		}

		return answer === true;
	};

	useEffect( () => {
		const element = dialog.current;

		if ( isDialogOpen.value ) {
			if ( ! element?.open ) {
				opener.current = element!.ownerDocument.activeElement;
				element!.showModal();
			}
			return;
		}

		if ( element?.open ) {
			element.close();

			// The control that opened it can be gone, as when a sign-in replaces "Add your name".
			if ( ! opener.current?.isConnected ) {
				internals.form
					?.querySelector< HTMLElement >( '.jetpack-comments__identity a:not([tabindex])' )
					?.focus();
			}
		}

		setStep( firstStep );
		setSubscribed( saved ?? defaultSubscribed() );
	}, [ isDialogOpen.value ] );

	// The button that turned the page is gone, so focus goes to the new page's first control.
	useEffect( () => {
		if ( step !== 'choose' ) {
			dialog.current?.querySelector( 'input' )?.focus();
		}
	}, [ step ] );

	// Whether the email belongs to a WordPress.com account, half a second after it stops
	// changing: each check counts against a rate limit, and a late answer for an old value is dropped.
	useEffect( () => {
		setEmailTaken( false );

		if ( ! showFields || ! isEmail( enteredEmail ) ) {
			return;
		}

		let current = true;
		const timer = window.setTimeout( async () => {
			const taken = await checkEmail( enteredEmail );

			if ( current ) {
				setEmailTaken( taken );
			}
		}, 500 );

		return () => {
			current = false;
			window.clearTimeout( timer );
		};
	}, [ enteredEmail, showFields ] );

	const logIn = async () => {
		setSignInStatus( 'pending' );

		// Cancel closes the popup, which settles this as cancelled.
		const result = await signIn( opened => {
			popup.current = opened;
		} );

		popup.current = null;

		if ( 'error' in result ) {
			setSignInStatus( result.error === 'rate_limited' ? 'rate_limited' : 'failed' );
			isDialogOpen.value = true;
			return;
		}

		setSignInStatus( 'idle' );

		if ( ! ( 'code' in result ) ) {
			return;
		}

		// One identity at a time: a saved guest is forgotten when they log in.
		forget();
		commenter.value = {
			kind: 'wordpress',
			name: result.name,
			avatar: result.avatar,
			code: result.code,
		};

		if ( isEmptyComment.peek() ) {
			isDialogOpen.value = false;
			return;
		}

		if ( formSettings.subscriptions.length ) {
			setStep( 'subscribe' );
			return;
		}

		isDialogOpen.value = false;

		// A timeout, so the render that puts the sign-in code in the form lands first.
		window.setTimeout( () => internals.form?.requestSubmit() );
	};

	const close = () => {
		isDialogOpen.value = false;
	};

	// Posting with "No, thanks" sends nothing of theirs: no details, no subscriptions.
	const formValue = ( consent: boolean, anonymous = false ) => {
		const data = new FormData();

		if ( anonymous ) {
			return data;
		}

		if ( guest ) {
			Object.entries( details.value ).forEach( ( [ name, value ] ) => data.append( name, value ) );
		}

		if ( showToggles || saved ) {
			chosen.forEach( name => data.append( name, 'subscribe' ) );
		}

		if ( consent ) {
			data.append( 'wp-comment-cookies-consent', 'yes' );
		}

		return data;
	};

	useEffect( () => internals.setFormValue( formValue( false ) ) );

	const submit = async ( event: Event ) => {
		event.preventDefault();

		if ( isPosting.peek() || checkingEmail ) {
			return;
		}

		const anonymous = ( event as SubmitEvent ).submitter?.getAttribute( 'name' ) === 'anonymous';

		if ( showFields ) {
			setCheckingEmail( true );
			let email = '';
			let taken = false;

			// Checked again if the email changes during the wait, since the new one is what posts.
			while ( email !== details.peek().email ) {
				email = details.peek().email;
				taken = isEmail( email ) && ( await checkEmail( email ) );
			}

			setCheckingEmail( false );

			// Closed during the wait, which cancels the submit.
			if ( ! isDialogOpen.peek() ) {
				return;
			}

			if ( taken ) {
				setEmailTaken( true );
				// The submit button turns disabled under the focus, which would drop it to the body.
				dialog.current?.querySelector< HTMLInputElement >( '#email' )?.focus();
				return;
			}
		}

		if ( ! posting ) {
			// Saved with consent, or cleared without it, as core does after a comment.
			saveGuest( rememberDetails.peek() ? details.value : null );

			if ( showToggles ) {
				setSaved( subscribed );
			}

			isDialogOpen.value = false;
			commenter.value =
				details.value.author !== '' && details.value.email !== ''
					? { kind: 'guest' }
					: { kind: 'unknown' };
			return;
		}

		// Read as the comment form submits, then dropped, so a blocked submit leaves no consent behind.
		internals.setFormValue( formValue( showFields && rememberDetails.peek(), anonymous ) );
		internals.form?.requestSubmit();
		internals.setFormValue( formValue( false ) );
	};

	const logInOrWait = (
		<LogIn
			status={ signInStatus }
			onLogIn={ () => logIn() }
			onCancel={ () => popup.current?.close() }
		/>
	);
	const switches = showToggles && (
		<SubscribeSwitches subscribed={ subscribed } onChange={ setSubscribed } />
	);
	const pages = {
		choose: (
			<>
				{ mustLogIn && <p className="jetpack-comments__dialog-intro">{ strings.mustLogIn }</p> }
				<div className="jetpack-comments__sign-in">
					{ logInOrWait }
					{ ! mustLogIn && (
						<button
							type="button"
							className="jetpack-comments__button is-secondary"
							onClick={ () => setStep( 'guest' ) }
						>
							{ strings.continueAsGuest }
						</button>
					) }
					{ /* Only with a comment to post, and where core takes one with no name. */ }
					{ posting && ! mustLogIn && ! requireNameEmail && (
						<button
							type="submit"
							name="anonymous"
							className="jetpack-comments__button is-link"
							aria-disabled={ isPosting.value || undefined }
						>
							{ strings.postWithoutSaving }
						</button>
					) }
				</div>
			</>
		),
		guest: (
			<>
				<p id="intro" className="jetpack-comments__dialog-intro">
					{ strings.intro }
				</p>
				<DetailsFields
					emailTaken={ emailTaken }
					introId="intro"
					logIn={ identity.canSignIn && logInOrWait }
				/>
				{ switches }
			</>
		),
		subscribe: switches,
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
					<Header onClose={ close } />
					{ pages[ step ] }
					{ step !== 'choose' && (
						<div className="jetpack-comments__dialog-actions">
							<button
								type="submit"
								className={ clsx( 'jetpack-comments__button is-primary', {
									'is-busy': isPosting.value || checkingEmail,
								} ) }
								disabled={ emailTaken }
								aria-disabled={ isPosting.value || checkingEmail || undefined }
							>
								{ ! posting && strings.save }
								{ posting && ( commentParent.value ? strings.reply : formSettings.submit.label ) }
							</button>
						</div>
					) }
				</form>
			</dialog>
		</>
	);
};

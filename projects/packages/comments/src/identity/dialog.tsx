import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { saveGuest } from '../shared/guest';
import { CommentSignals } from '../shared/state';
import { emailHasAccount, logOut, signIn } from './checkpoint/checkpoint';
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
 * Asks a commenter who they are on their way to posting, plus any subscribe options
 * the host offers.
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
	} = useContext( CommentSignals );
	const { site, strings, mustLogIn, requireNameEmail, identity } = JetpackComments;
	const dialog = useRef< HTMLDialogElement >( null );
	const popup = useRef< Window | null >( null );
	const opener = useRef< Element | null >( null );
	const [ signInStatus, setSignInStatus ] = useState<
		'idle' | 'pending' | 'failed' | 'rate_limited'
	>( 'idle' );
	const [ emailTaken, setEmailTaken ] = useState( false );
	// Straight to the fields when they are the only way through.
	const firstStep = identity.canSignIn ? 'choose' : 'guest';
	const [ step, setStep ] = useState< 'choose' | 'guest' | 'subscribe' >( firstStep );
	const defaultSubscribed = () =>
		Object.fromEntries(
			formSettings.subscriptions.map( ( { name, checked } ) => [ name, checked ] )
		);
	const [ subscribed, setSubscribed ] = useState< Record< string, boolean > >( defaultSubscribed );
	const posting = ! isEmptyComment.value;

	const showFields = step === 'guest';
	const showToggles =
		formSettings.subscriptions.length > 0 &&
		isDialogOpen.value &&
		posting &&
		( step === 'guest' || step === 'subscribe' );
	const chosen = formSettings.subscriptions
		.filter( ( { name } ) => subscribed[ name ] )
		.map( ( { name } ) => name );
	const guest =
		( commenter.value.kind === 'guest' || commenter.value.kind === 'unknown' ) && ! mustLogIn;
	const enteredEmail = details.value.email;

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
				internals.form?.querySelector< HTMLElement >( '.jetpack-comments__identity a' )?.focus();
			}
		}

		setStep( firstStep );
		setSubscribed( defaultSubscribed() );
	}, [ isDialogOpen.value ] );

	// A WordPress.com commenter keeps their passport until they finish switching away from it.
	const switching = commenter.value.kind === 'wordpress';
	const leaving = switching && isDialogOpen.value && step === 'guest';

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

		if ( ! showFields || ! /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test( enteredEmail ) ) {
			return;
		}

		let current = true;
		const timer = window.setTimeout( async () => {
			const taken = await emailHasAccount( enteredEmail );

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
		}, switching );

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

		// One identity at a time: a saved guest is forgotten when they log in. A previous
		// sign-in's passport is left to the comment, whose new one replaces it.
		saveGuest( null );
		details.value = { author: '', email: '', url: '' };
		rememberDetails.value = false;
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

		if ( guest || leaving ) {
			Object.entries( details.value ).forEach( ( [ name, value ] ) => data.append( name, value ) );
		}

		if ( showToggles ) {
			chosen.forEach( name => data.append( name, 'subscribe' ) );
		}

		if ( consent ) {
			data.append( 'wp-comment-cookies-consent', 'yes' );
		}

		return data;
	};

	useEffect( () => internals.setFormValue( formValue( false ) ) );

	const submit = ( event: Event ) => {
		event.preventDefault();

		// The switch commits here, so closing the dialog leaves the sign-in as it was.
		if ( leaving ) {
			logOut();
		}

		if ( ! posting ) {
			// Saved with consent, or cleared without it, as core does after a comment.
			saveGuest( rememberDetails.peek() ? details.value : null );

			isDialogOpen.value = false;
			commenter.value =
				details.value.author !== '' && details.value.email !== ''
					? { kind: 'guest' }
					: { kind: 'unknown' };
			return;
		}

		const anonymous = ( event as SubmitEvent ).submitter?.getAttribute( 'name' ) === 'anonymous';

		// Read as the comment form submits, then dropped, so a blocked submit leaves no consent behind.
		const send = () => {
			internals.setFormValue( formValue( showFields && rememberDetails.peek(), anonymous ) );
			internals.form?.requestSubmit();
			internals.setFormValue( formValue( false ) );
		};

		if ( ! leaving ) {
			send();
			return;
		}

		// A timeout, so the render that drops the passport field lands first.
		commenter.value = { kind: 'unknown' };
		window.setTimeout( send );
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
					{ /* Only with a comment to post, where core takes one with no name, and not from a sign-in, whose passport would still post. */ }
					{ posting && guest && ! requireNameEmail && (
						<button type="submit" name="anonymous" className="jetpack-comments__button is-link">
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
				<DetailsFields emailTaken={ emailTaken } introId="intro" />
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
					{ pages[ step ] }
					{ step !== 'choose' && (
						<div className="jetpack-comments__dialog-actions">
							<button
								type="submit"
								className="jetpack-comments__button is-primary"
								disabled={ emailTaken }
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

/**
 * Log in with WordPress.com, or wait on the popup with a way to cancel it.
 *
 * @param props          - Component props.
 * @param props.status   - Where the sign-in is.
 * @param props.onLogIn  - Opens the popup.
 * @param props.onCancel - Closes it.
 * @return The button, or the wait, and any error.
 */
const LogIn = ( {
	status,
	onLogIn,
	onCancel,
}: {
	status: 'idle' | 'pending' | 'failed' | 'rate_limited';
	onLogIn: () => void;
	onCancel: () => void;
} ) => {
	const { strings } = JetpackComments;

	return (
		<>
			{ status === 'pending' ? (
				<span className="jetpack-comments__signing-in">
					<span className="jetpack-comments__spinner" aria-hidden="true" />
					<button type="button" className="jetpack-comments__button is-link" onClick={ onCancel }>
						{ strings.cancel }
					</button>
				</span>
			) : (
				<button type="button" className="jetpack-comments__button is-primary" onClick={ onLogIn }>
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
			) }
			{ ( status === 'failed' || status === 'rate_limited' ) && (
				<span className="jetpack-comments__notice" role="status">
					{ status === 'rate_limited' ? strings.signInRateLimited : strings.signInFailed }
				</span>
			) }
		</>
	);
};

/**
 * Name, email and website, and whether to save them.
 *
 * @param props            - Component props.
 * @param props.emailTaken - Whether the email belongs to a WordPress.com account.
 * @param props.introId    - The intro describing the fields, read with the first one.
 * @return The fields and the save switch.
 */
const DetailsFields = ( { emailTaken, introId }: { emailTaken: boolean; introId?: string } ) => {
	const { details, rememberDetails } = useContext( CommentSignals );
	const { strings, requireNameEmail } = JetpackComments;
	const fields = [
		{
			field: 'author' as const,
			type: 'text',
			autoComplete: 'name',
			label: strings.name,
			describedBy: introId,
		},
		{
			field: 'email' as const,
			type: 'email',
			autoComplete: 'email',
			label: strings.email,
			describedBy: 'email-notes',
		},
		{ field: 'url' as const, type: 'url', autoComplete: 'url', label: strings.website },
	];

	return (
		<>
			{ fields.map( ( { field, ...input } ) => (
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
						aria-describedby={ input.describedBy }
						aria-invalid={ field === 'email' && emailTaken ? 'true' : undefined }
						required={ requireNameEmail && field !== 'url' }
						value={ details.value[ field ] }
						onInput={ event => {
							details.value = { ...details.value, [ field ]: event.currentTarget.value };
						} }
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
			<label htmlFor="remember" className="jetpack-comments__toggle">
				<input
					id="remember"
					type="checkbox"
					role="switch"
					checked={ rememberDetails.value }
					onChange={ event => ( rememberDetails.value = event.currentTarget.checked ) }
				/>
				{ strings.saveDetails }
			</label>
		</>
	);
};

/**
 * The host's subscribe options, as switches.
 *
 * @param props            - Component props.
 * @param props.subscribed - Which are on, by field name.
 * @param props.onChange   - Called with the new set.
 * @return The switches.
 */
const SubscribeSwitches = ( {
	subscribed,
	onChange,
}: {
	subscribed: Record< string, boolean >;
	onChange: ( subscribed: Record< string, boolean > ) => void;
} ) => {
	const { formSettings } = useContext( CommentSignals );

	return (
		<>
			{ formSettings.subscriptions.map( ( { name, label } ) => (
				<label key={ name } htmlFor={ name } className="jetpack-comments__toggle">
					<input
						id={ name }
						type="checkbox"
						role="switch"
						checked={ subscribed[ name ] }
						onChange={ event =>
							onChange( { ...subscribed, [ name ]: event.currentTarget.checked } )
						}
					/>
					{ label }
				</label>
			) ) }
		</>
	);
};

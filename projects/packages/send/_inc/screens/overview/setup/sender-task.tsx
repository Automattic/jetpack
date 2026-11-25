import { speak } from '@wordpress/a11y';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	AlertDialog,
	Badge,
	Button,
	InputControl,
	InputLayout,
	Notice,
	Stack,
	Text,
} from '@wordpress/ui';
import TextAction from '../../../components/text-action';
import { postAction } from '../../../data/api';
import { sendStore } from '../../../data/store';
import { isTemporaryDomain } from './model';
import TaskCard from './task-card';
import type { TaskState } from './model';
import type { SendStatus, SettingsUpdate } from '../../../data/types';

/** Core's default mailbox, used when the admin's own mailbox isn't on the sending domain. */
export const DEFAULT_LOCAL_PART = 'wordpress';

const DOMAIN_PATTERN = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const LOCAL_PART_PATTERN = /^[a-z0-9](?:[a-z0-9._+-]*[a-z0-9])?$/i;
const PLUGIN_INSTALL_URL = 'plugin-install.php?s=jetpack&tab=search&type=term';

export type InferredSender = {
	domain: string;
	name: string;
	localPart: string;
	/** '' when the From address is the admin's own mailbox. */
	replyTo: string;
};

/**
 * A bare lowercase domain from user input, or '' when it isn't one (same rules as the server).
 *
 * @param input - What the user typed.
 * @return The domain, or ''.
 */
export function normalizeDomain( input: string ): string {
	const bare = input
		.trim()
		.toLowerCase()
		.replace( /^[a-z]+:\/\//, '' )
		.split( '/' )[ 0 ]
		.replace( /\.+$/, '' );
	return DOMAIN_PATTERN.test( bare ) ? bare : '';
}

/**
 * Reply-To for a From mailbox: the admin email when we fell back to `wordpress@`.
 *
 * @param localPart - The From mailbox.
 * @param status    - Send status.
 * @return The address, or ''.
 */
function replyToFor( localPart: string, status: SendStatus ): string {
	if ( localPart !== DEFAULT_LOCAL_PART ) {
		return '';
	}
	return status.settings.reply_to || status.admin_email || '';
}

/**
 * The sender we suggest: the admin's mailbox when it's on the domain, else `wordpress@` with
 * replies going to the admin.
 *
 * @param status - Send status.
 * @return The inferred sender.
 */
export function inferSender( status: SendStatus ): InferredSender {
	const domain = status.account?.domain ?? status.suggested_domain;
	const [ adminLocal = '', adminDomain = '' ] = status.admin_email.toLowerCase().split( '@' );
	const adminOnDomain = !! adminLocal && adminDomain === domain;
	const saved = status.settings.from_local_part;
	const hasCustomLocal = !! saved && saved !== DEFAULT_LOCAL_PART;
	let localPart = DEFAULT_LOCAL_PART;
	if ( status.account || hasCustomLocal ) {
		localPart = saved || DEFAULT_LOCAL_PART;
	} else if ( adminOnDomain ) {
		localPart = adminLocal;
	}
	return {
		domain,
		name: status.settings.from_name || status.site_title,
		localPart,
		replyTo: replyToFor( localPart, status ),
	};
}

/**
 * The REST error code from an apiFetch rejection.
 *
 * @param error - The rejection.
 * @return The code, or ''.
 */
function errorCode( error: unknown ): string {
	return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
		? error.code
		: '';
}

type FieldErrors = { localPart?: string; domain?: string };

type Props = {
	status: SendStatus;
	state: TaskState;
	open: boolean;
	onOpenChange: ( open: boolean ) => void;
	/** Sending was set up for a new domain by this card. */
	onSetUp: ( domain: string ) => void;
	/** The From line being typed, for the inbox preview; null when the form is closed. */
	onDraftChange?: ( draft: SenderDraft | null ) => void;
};

/** The From line as typed in Change, before it's saved. */
export type SenderDraft = { name: string; address: string };

/**
 * Task 1, "Choose who your emails come from": the From line, Change, and setting up sending.
 *
 * @param props               - Component props.
 * @param props.status        - Send status.
 * @param props.state         - Task state.
 * @param props.open          - Whether the card is open.
 * @param props.onOpenChange  - Open or close the card.
 * @param props.onSetUp       - Called once sending is set up for a new domain.
 * @param props.onDraftChange - Called with the From line as it's typed.
 * @return The task card.
 */
const SenderTask = ( { status, state, open, onOpenChange, onSetUp, onDraftChange }: Props ) => {
	const { receiveStatus } = useDispatch( sendStore );
	const inferred = useMemo( () => inferSender( status ), [ status ] );
	const done = state === 'done';
	const temporary = ! status.account && isTemporaryDomain( status.suggested_domain );
	const notConnected = status.provisioner === null && !! status.connect_url;
	const cannotConnect = status.provisioner === null && ! status.connect_url;

	const [ editing, setEditing ] = useState( temporary );
	const [ showDomain, setShowDomain ] = useState( temporary );
	const [ name, setName ] = useState( inferred.name );
	const [ localPart, setLocalPart ] = useState( inferred.localPart );
	const [ domainInput, setDomainInput ] = useState( temporary ? '' : inferred.domain );
	const [ busy, setBusy ] = useState( false );
	const [ fieldErrors, setFieldErrors ] = useState< FieldErrors >( {} );
	const [ failed, setFailed ] = useState( false );
	const [ switchTo, setSwitchTo ] = useState< string | null >( null );
	const [ focusError, setFocusError ] = useState< keyof FieldErrors | null >( null );

	const busyRef = useRef( false );
	const localTouched = useRef( false );
	const domainFieldRef = useRef< HTMLInputElement >( null );
	const localFieldRef = useRef< HTMLInputElement >( null );
	const changeRef = useRef< HTMLButtonElement >( null );

	const domain = normalizeDomain( domainInput );
	const domainUsable = !! domain && ! isTemporaryDomain( domain );
	const shownDomain = domainUsable ? domain : '';
	const trimmedLocal = localPart.trim().toLowerCase();
	const replyTo = replyToFor( trimmedLocal, status );
	const displayName = name.trim() || status.site_title;
	// '' means "use the site title", so the name follows it if the title changes later.
	const storedName = displayName === status.site_title ? '' : displayName;
	const address = shownDomain ? `${ trimmedLocal || DEFAULT_LOCAL_PART }@${ shownDomain }` : '';
	const savedAddress = status.account
		? `${ status.settings.from_local_part || DEFAULT_LOCAL_PART }@${ status.account.domain }`
		: '';

	useEffect( () => {
		onDraftChange?.( editing ? { name: displayName, address } : null );
	}, [ editing, displayName, address, onDraftChange ] );

	// Until the user edits the address, follow the domain: the admin's mailbox when it's on it.
	useEffect( () => {
		if ( localTouched.current || ! domainUsable || status.account?.domain === domain ) {
			return;
		}
		const [ adminLocal = '', adminDomain = '' ] = status.admin_email.toLowerCase().split( '@' );
		const saved = status.settings.from_local_part;
		if ( saved && saved !== DEFAULT_LOCAL_PART ) {
			return;
		}
		setLocalPart( adminLocal && adminDomain === domain ? adminLocal : DEFAULT_LOCAL_PART );
	}, [
		domain,
		domainUsable,
		status.account?.domain,
		status.admin_email,
		status.settings.from_local_part,
	] );

	useEffect( () => {
		if ( ! focusError ) {
			return;
		}
		( focusError === 'domain' ? domainFieldRef : localFieldRef ).current?.focus();
		setFocusError( null );
	}, [ focusError ] );

	const resetFields = useCallback( () => {
		const fresh = inferSender( status );
		localTouched.current = false;
		setName( fresh.name );
		setLocalPart( fresh.localPart );
		setDomainInput( fresh.domain );
		setShowDomain( false );
		setFieldErrors( {} );
	}, [ status ] );

	const save = useCallback(
		async ( switchConfirmed = false ) => {
			if ( busyRef.current ) {
				return;
			}
			const errors: FieldErrors = {};
			if ( ! LOCAL_PART_PATTERN.test( trimmedLocal ) ) {
				errors.localPart = __( 'Use letters, numbers, dots or dashes.', 'jetpack-send-pkg' );
			}
			if ( ! domainUsable ) {
				errors.domain = __( 'Enter a domain you own, like example.com.', 'jetpack-send-pkg' );
			}
			setFieldErrors( errors );
			setFailed( false );
			if ( errors.localPart || errors.domain ) {
				setEditing( true );
				setShowDomain( showing => showing || !! errors.domain );
				setFocusError( errors.domain ? 'domain' : 'localPart' );
				return;
			}

			const account = status.account;
			const needsSetup = ! account || account.domain !== domain;
			if ( account && needsSetup && ! switchConfirmed ) {
				setSwitchTo( domain );
				return;
			}

			busyRef.current = true;
			setBusy( true );
			try {
				const changes: SettingsUpdate = {};
				if ( storedName !== status.settings.from_name ) {
					changes.from_name = storedName;
				}
				if ( trimmedLocal !== status.settings.from_local_part ) {
					changes.from_local_part = trimmedLocal;
				}
				if ( replyTo !== ( status.settings.reply_to ?? '' ) ) {
					changes.reply_to = replyTo;
				}
				if ( Object.keys( changes ).length ) {
					receiveStatus( await postAction( 'settings', changes ) );
				}
				if ( needsSetup ) {
					receiveStatus( await postAction( 'setup', { domain } ) );
					speak(
						sprintf(
							/* translators: %s: the sending domain. */
							__( 'Sending is set up for %s. Next, add 2 records.', 'jetpack-send-pkg' ),
							domain
						)
					);
					onSetUp( domain );
				} else {
					speak( __( 'Sender saved.', 'jetpack-send-pkg' ) );
					window.requestAnimationFrame( () => changeRef.current?.focus() );
				}
				setEditing( false );
				setShowDomain( false );
			} catch ( error ) {
				const code = errorCode( error );
				if ( code === 'jetpack_send_invalid_from' ) {
					setFieldErrors( {
						localPart: __( 'Use letters, numbers, dots or dashes.', 'jetpack-send-pkg' ),
					} );
					setEditing( true );
					setFocusError( 'localPart' );
				} else if ( code === 'jetpack_send_invalid_domain' ) {
					setFieldErrors( {
						domain: __( 'Enter a domain you own, like example.com.', 'jetpack-send-pkg' ),
					} );
					setEditing( true );
					setShowDomain( true );
					setFocusError( 'domain' );
				} else {
					setFailed( true );
					speak(
						sprintf(
							/* translators: %s: the sending domain. */
							__(
								'We couldn’t set up sending for %s. Nothing on your site changed. Try again in a minute.',
								'jetpack-send-pkg'
							),
							domain
						),
						'assertive'
					);
				}
			} finally {
				busyRef.current = false;
				setBusy( false );
			}
		},
		[ domain, domainUsable, onSetUp, receiveStatus, replyTo, status, storedName, trimmedLocal ]
	);

	const onSave = useCallback( () => void save(), [ save ] );
	const startEditing = useCallback( () => {
		if ( done ) {
			resetFields();
		}
		setEditing( true );
		window.requestAnimationFrame( () => localFieldRef.current?.focus() );
	}, [ done, resetFields ] );
	const cancelEditing = useCallback( () => {
		resetFields();
		setEditing( false );
		window.requestAnimationFrame( () => changeRef.current?.focus() );
	}, [ resetFields ] );
	const onDomainBlur = useCallback( () => {
		if ( domainInput.trim() && ! domainUsable ) {
			setFieldErrors( current => ( {
				...current,
				domain: __( 'Enter a domain you own, like example.com.', 'jetpack-send-pkg' ),
			} ) );
		}
	}, [ domainInput, domainUsable ] );
	const revealDomain = useCallback( () => {
		setShowDomain( true );
		window.requestAnimationFrame( () => domainFieldRef.current?.focus() );
	}, [] );
	const onDomainChange = useCallback( ( value: string ) => {
		setDomainInput( value );
		setFieldErrors( current => ( { ...current, domain: undefined } ) );
	}, [] );
	const onLocalPartChange = useCallback( ( value: string ) => {
		localTouched.current = true;
		setLocalPart( value );
		setFieldErrors( current => ( { ...current, localPart: undefined } ) );
	}, [] );
	const onSwitchOpenChange = useCallback(
		( isOpen: boolean ) => ! isOpen && setSwitchTo( null ),
		[]
	);
	const onSwitchConfirm = useCallback( () => {
		setSwitchTo( null );
		void save( true );
	}, [ save ] );

	const panelId = 'jetpack-send-setup-sender-fields';
	const adminDomain = status.admin_email.toLowerCase().split( '@' )[ 1 ] ?? '';
	const fellBack = !! shownDomain && trimmedLocal === DEFAULT_LOCAL_PART && !! replyTo;

	let headerEnd = null;
	if ( failed ) {
		headerEnd = <Badge intent="high">{ __( 'Didn’t work', 'jetpack-send-pkg' ) }</Badge>;
	} else if ( done ) {
		headerEnd = savedAddress;
	}

	return (
		<TaskCard
			id="sender"
			state={ failed ? 'failed' : state }
			title={ __( 'Choose who your emails come from', 'jetpack-send-pkg' ) }
			headerEnd={ headerEnd }
			headerEndShrinks={ done && ! failed }
			subtitle={ __(
				'Password resets, receipts and form replies will come from this address, so they land in the inbox, not spam.',
				'jetpack-send-pkg'
			) }
			open={ open }
			onOpenChange={ onOpenChange }
		>
			<Stack direction="column" gap="lg" className="jetpack-send-setup__body">
				{ ! editing && (
					<Stack direction="row" align="center" gap="md" wrap="wrap">
						<Stack direction="column" className="jetpack-send-setup__grow">
							<Text variant="body-lg">{ displayName }</Text>
							<Text variant="body-md" className="jetpack-send-setup__weak jetpack-send-setup__wrap">
								{ address || __( 'Add your domain', 'jetpack-send-pkg' ) }
							</Text>
						</Stack>
						{ ! done && (
							<Button
								ref={ changeRef }
								variant="minimal"
								tone="neutral"
								size="compact"
								onClick={ startEditing }
							>
								{ __( 'Change', 'jetpack-send-pkg' ) }
							</Button>
						) }
					</Stack>
				) }

				{ ! editing && fellBack && (
					<Text variant="body-md" render={ <p /> } className="jetpack-send-setup__weak">
						{ adminDomain && adminDomain !== shownDomain
							? sprintf(
									/* translators: 1: the admin's mail domain, 2: the sending domain, 3: the admin's email address. */
									__(
										'Your address is at %1$s, so we’ll send from wordpress@%2$s. Replies still reach you at %3$s.',
										'jetpack-send-pkg'
									),
									adminDomain,
									shownDomain,
									replyTo
								)
							: sprintf(
									/* translators: %s: email address replies go to. */
									__( 'Replies go to %s.', 'jetpack-send-pkg' ),
									replyTo
								) }
					</Text>
				) }

				{ editing && (
					<Stack direction="column" gap="md" id={ panelId }>
						{ temporary && (
							<Text variant="body-lg" render={ <p /> }>
								{ __(
									'This site is on a temporary address. Which domain do you send email from?',
									'jetpack-send-pkg'
								) }
							</Text>
						) }
						<InputControl
							label={ __( 'Name', 'jetpack-send-pkg' ) }
							placeholder={ status.site_title }
							value={ name }
							onValueChange={ setName }
						/>
						<InputControl
							ref={ localFieldRef }
							label={ __( 'Address', 'jetpack-send-pkg' ) }
							value={ localPart }
							onValueChange={ onLocalPartChange }
							aria-invalid={ !! fieldErrors.localPart }
							description={
								fieldErrors.localPart ??
								__( 'Use an inbox you check, so replies reach you.', 'jetpack-send-pkg' )
							}
							suffix={
								<InputLayout.Slot>{ `@${ shownDomain || domainInput.trim() }` }</InputLayout.Slot>
							}
							autoComplete="off"
							spellCheck={ false }
						/>
						{ showDomain ? (
							<InputControl
								ref={ domainFieldRef }
								label={ __( 'Domain', 'jetpack-send-pkg' ) }
								placeholder="example.com"
								value={ domainInput }
								onValueChange={ onDomainChange }
								onBlur={ onDomainBlur }
								aria-invalid={ !! fieldErrors.domain }
								description={ fieldErrors.domain }
								autoComplete="off"
								spellCheck={ false }
							/>
						) : (
							<Text variant="body-lg" render={ <div /> }>
								<TextAction onClick={ revealDomain }>
									{ __( 'Use a different domain', 'jetpack-send-pkg' ) }
								</TextAction>
							</Text>
						) }
					</Stack>
				) }

				{ notConnected && ! done && (
					<Notice.Root intent="warning">
						<Notice.Title>{ __( 'Connect Jetpack first.', 'jetpack-send-pkg' ) }</Notice.Title>
						<Notice.Description>
							{ __( 'Send uses your Jetpack connection to set up sending.', 'jetpack-send-pkg' ) }
						</Notice.Description>
						<Notice.Actions>
							<Notice.ActionLink href={ status.connect_url }>
								{ __( 'Connect Jetpack', 'jetpack-send-pkg' ) }
							</Notice.ActionLink>
						</Notice.Actions>
					</Notice.Root>
				) }

				{ cannotConnect && ! done && (
					<Notice.Root intent="warning">
						<Notice.Description>
							{ __( 'Install and connect Jetpack to use Send.', 'jetpack-send-pkg' ) }
						</Notice.Description>
						<Notice.Actions>
							<Notice.ActionLink href={ PLUGIN_INSTALL_URL }>
								{ __( 'Get Jetpack', 'jetpack-send-pkg' ) }
							</Notice.ActionLink>
						</Notice.Actions>
					</Notice.Root>
				) }

				{ failed && (
					<Notice.Root intent="error">
						<Notice.Title>
							{ sprintf(
								/* translators: %s: the sending domain. */
								__( 'We couldn’t set up sending for %s.', 'jetpack-send-pkg' ),
								shownDomain || __( 'your domain', 'jetpack-send-pkg' )
							) }
						</Notice.Title>
						<Notice.Description>
							{ __( 'Nothing on your site changed. Try again in a minute.', 'jetpack-send-pkg' ) }
						</Notice.Description>
					</Notice.Root>
				) }

				<Stack direction="row" align="center" gap="sm" wrap="wrap">
					{ done && ! editing && (
						<Button
							ref={ changeRef }
							variant="minimal"
							tone="neutral"
							size="compact"
							onClick={ startEditing }
						>
							{ __( 'Change', 'jetpack-send-pkg' ) }
						</Button>
					) }
					{ ( ! done || editing ) && ! notConnected && ! cannotConnect && (
						<Button
							variant="solid"
							onClick={ onSave }
							disabled={ ! domainUsable }
							loading={ busy }
							loadingAnnouncement={ sprintf(
								/* translators: %s: the sending domain. */
								__( 'Setting up sending for %s…', 'jetpack-send-pkg' ),
								shownDomain || __( 'your domain', 'jetpack-send-pkg' )
							) }
						>
							{ /* One retry control: the main button becomes Try again, so focus stays on it. */ }
							{ failed && __( 'Try again', 'jetpack-send-pkg' ) }
							{ ! failed && done && __( 'Save', 'jetpack-send-pkg' ) }
							{ ! failed && ! done && __( 'Use this address', 'jetpack-send-pkg' ) }
						</Button>
					) }
					{ editing && ! temporary && (
						<Button variant="minimal" tone="neutral" onClick={ cancelEditing }>
							{ __( 'Cancel', 'jetpack-send-pkg' ) }
						</Button>
					) }
				</Stack>
			</Stack>

			<AlertDialog.Root
				open={ switchTo !== null }
				onOpenChange={ onSwitchOpenChange }
				onConfirm={ onSwitchConfirm }
			>
				<AlertDialog.Popup
					title={ sprintf(
						/* translators: %s: the new sending domain. */
						__( 'Switch to %s?', 'jetpack-send-pkg' ),
						switchTo ?? ''
					) }
					description={ sprintf(
						/* translators: 1: the new sending domain, 2: the domain set up before. */
						__(
							'We’ll make new records for %1$s. Records you added for %2$s won’t be used.',
							'jetpack-send-pkg'
						),
						switchTo ?? '',
						status.account?.domain ?? ''
					) }
					confirmButtonText={ __( 'Switch', 'jetpack-send-pkg' ) }
					cancelButtonText={ __( 'Cancel', 'jetpack-send-pkg' ) }
				/>
			</AlertDialog.Root>
		</TaskCard>
	);
};

export default SenderTask;

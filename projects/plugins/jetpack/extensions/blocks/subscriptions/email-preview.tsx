import { getRedirectUrl } from '@automattic/jetpack-components';
import { getUserConnectionUrl, useConnection } from '@automattic/jetpack-connection';
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	__experimentalGrid as Grid, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Modal,
	Notice,
	__experimentalInputControl as InputControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Icon,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Spinner,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { select, useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import {
	useState,
	useCallback,
	useEffect,
	useRef,
	createInterpolateElement,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	desktop,
	mobile,
	tablet,
	check,
	people,
	currencyDollar,
	cautionFilled as warning,
	styles,
} from '@wordpress/icons';
import { Link, VisuallyHidden } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import './email-preview.scss';
import { accessOptions } from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { SendIcon } from './icons';
import type { JSX } from 'react';

/*
 * The newsletter package declares the same key for its own bundle (`settings/declarations.d.ts`);
 * this is the plugin-side copy, because that type is internal to the package. Keep them in step.
 */
declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		newsletter?: { emailDesignUrl?: string | null };
	}
}

interface PreviewErrorInfo {
	code?: string;
	message: string;
}

/**
 * Error code returned by the email-preview REST endpoints when the current user
 * has no WordPress.com user connection. Both `send-email-preview` and
 * `email-preview` share this code.
 *
 * @see projects/plugins/jetpack/_inc/lib/core-api/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-send-email-preview.php
 */
const MISSING_CONNECTION_ERROR_CODE = 'rest_cannot_send_email_preview';

/**
 * apiFetch surfaces transport and parse failures under codes that aren't
 * user-actionable. The most common in the wild is an Atomic edge rate-limit:
 * the web-server layer returns a `text/html` 429 page before WordPress runs, so
 * there's no JSON envelope and apiFetch collapses the whole response to
 * `invalid_json` with the 429 status dropped. Showing that raw parser message to
 * the user is meaningless — surface the friendly generic fallback instead.
 *
 * The heavier `parse: false` pattern that recovers the exact HTTP status lives
 * in projects/packages/podcast/src/admin-pages/create-ai-podcast/index.js.
 */
const NON_ACTIONABLE_ERROR_CODES = [ 'invalid_json', 'unknown_error' ];

/**
 * Lightweight client-side email format check, used to give instant feedback and
 * skip the draft save + network round-trip on obviously malformed input. The
 * server performs the authoritative validation.
 *
 * @param {string} email - Address to check.
 * @return {boolean} Whether the address looks like a valid email.
 */
function isValidEmail( email ) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email );
}

/**
 * Actionable notice shown when a preview request fails because the user's
 * WordPress.com account isn't connected. Links to the connection flow so the
 * user can resolve it without leaving the editor guessing.
 * @return {JSX.Element} The notice element.
 */
function MissingConnectionNotice() {
	return (
		<p>
			{ createInterpolateElement(
				__(
					'Previewing and sending test emails requires a connection to WordPress.com. <connectLink>Connect your account</connectLink> to continue.',
					'jetpack'
				),
				{
					connectLink: <Link href={ getUserConnectionUrl() } />,
				}
			) }
		</p>
	);
}

interface NewsletterTestEmailModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function NewsletterTestEmailModal( { isOpen, onClose }: NewsletterTestEmailModalProps ) {
	const [ isEmailSent, setIsEmailSent ] = useState( false );
	const [ isEmailSending, setIsEmailSending ] = useState( false );
	const [ error, setError ] = useState< PreviewErrorInfo | null >( null );
	const [ recipientEmail, setRecipientEmail ] = useState(
		() => window?.Jetpack_Editor_Initial_State?.tracksUserData?.email ?? ''
	);
	const postId = useSelect( selectFn => selectFn( editorStore ).getCurrentPostId() );
	const { __unstableSaveForPreview } = useDispatch( editorStore );
	const { tracks } = useAnalytics();

	// Whether the user may send to an address other than their own. The server
	// enforces this regardless; locking the field here just spares users who
	// can't use it from an error they can't act on. Defaults to editable when the
	// flag is absent so a permitted user is never blocked by a stale initial state.
	const canEditRecipient =
		window?.Jetpack_Editor_Initial_State?.jetpack?.can_send_test_email_to_others ?? true;

	// The connection state is known client-side, so surface the requirement (and
	// disable sending) as soon as the modal opens rather than after a failed send.
	const { isUserConnected } = useConnection();
	const shouldPromptForConnection = ! isSimpleSite() && ! isUserConnected;
	const showConnectionNotice =
		shouldPromptForConnection || error?.code === MISSING_CONNECTION_ERROR_CODE;

	const sendTestEmail = async () => {
		const email = recipientEmail?.trim() ?? '';

		// Validate client-side first for instant feedback, skipping the draft save
		// and the network round-trip on malformed input. An empty address is
		// allowed: the server falls back to the current user.
		if ( email && ! isValidEmail( email ) ) {
			setError( {
				code: 'invalid_email',
				message: __( 'Please enter a valid email address.', 'jetpack' ),
			} );
			return;
		}

		tracks.recordEvent( 'jetpack_newsletter_test_email_send', { post_id: postId } );
		setError( null );
		setIsEmailSending( true );
		await __unstableSaveForPreview();

		apiFetch( {
			path: '/wpcom/v2/send-email-preview/',
			method: 'POST',
			data: { id: postId, email },
		} )
			.then( () => {
				setIsEmailSending( false );
				setIsEmailSent( true );
			} )
			.catch( ( e: { code?: string; message?: string } ) => {
				setIsEmailSending( false );
				// A structured WP_Error carries a code and a user-facing message we
				// can show verbatim. A rejection without an actionable code — no code
				// at all, or a transport/parse code like `invalid_json` from an
				// upstream rate limiter (see NON_ACTIONABLE_ERROR_CODES) — gets a
				// friendly generic fallback rather than a raw parser message.
				const hasActionableMessage =
					e?.code && ! NON_ACTIONABLE_ERROR_CODES.includes( e.code ) && e.message;
				setError( {
					code: e?.code,
					message: hasActionableMessage
						? e.message
						: __(
								'Something went wrong sending the test email. Please try again in a little while.',
								'jetpack'
							),
				} );
			} );
	};

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			onRequestClose={ () => {
				onClose();
				setIsEmailSent( false );
			} }
			title={ __( 'Send a test email', 'jetpack' ) }
			size={ 'medium' }
		>
			<VStack>
				{ showConnectionNotice && <MissingConnectionNotice /> }
				{ error && error.code !== MISSING_CONNECTION_ERROR_CODE && (
					<Notice
						status="error"
						isDismissible={ false }
						className="jetpack-newsletter-test-email-modal__error"
					>
						{ error.message }
					</Notice>
				) }
				{ isEmailSent ? (
					<HStack alignment="left" className="jetpack-newsletter-test-email-modal__email-sent">
						<Icon icon={ check } size={ 28 } />
						<p>{ __( 'Email sent successfully', 'jetpack' ) }</p>
					</HStack>
				) : (
					<>
						<p>
							{ canEditRecipient
								? __(
										'Send a test email to see exactly what your subscribers receive in their inboxes. It defaults to your address, but you can send it to any address you could add as a subscriber.',
										'jetpack'
									)
								: __(
										'Send a test email to your address so you can see exactly what your subscribers receive in their inboxes.',
										'jetpack',
										// @ts-expect-error Dummy arg to avoid bad minification; ignored at runtime.
										0
									) }
						</p>
						<form
							// noValidate keeps our own isValidEmail check the single,
							// translated, Notice-styled source of validation. Without it
							// the type="email" input's native constraint validation would
							// block submit on malformed input and show a browser bubble
							// instead of our inline error.
							noValidate
							onSubmit={ event => {
								// The modal renders in a portal outside the editor's own
								// form, so this submit is self-contained. Prevent the
								// default navigation and route Enter (and the button's
								// native submit) through the same send path as a click.
								event.preventDefault();
								sendTestEmail();
							} }
						>
							<Grid alignment="bottom" columns={ 2 } gap={ 2 } templateColumns="2fr auto">
								<InputControl
									type="email"
									value={ recipientEmail }
									onChange={ value => setRecipientEmail( value ?? '' ) }
									disabled={ isEmailSending || ! canEditRecipient }
									label={ __( 'Recipient email address', 'jetpack' ) }
									hideLabelFromVision
									__next40pxDefaultSize={ true }
								/>
								<Button
									type="submit"
									variant="primary"
									icon={ SendIcon }
									isBusy={ isEmailSending }
									disabled={ shouldPromptForConnection }
									__next40pxDefaultSize={ true }
								>
									{ __( 'Send', 'jetpack' ) }
								</Button>
							</Grid>
						</form>
					</>
				) }
			</VStack>
		</Modal>
	);
}

type PreviewDeviceName = 'desktop' | 'tablet' | 'mobile';

interface PreviewDevice {
	name: PreviewDeviceName;
	icon: JSX.Element;
	label: string;
	width: string;
	size: 'lg' | 'md' | 'sm';
}

const previewDevices: PreviewDevice[] = [
	{ name: 'desktop', icon: desktop, label: __( 'Desktop', 'jetpack' ), width: '100%', size: 'lg' },
	{ name: 'tablet', icon: tablet, label: __( 'Tablet', 'jetpack' ), width: '768px', size: 'md' },
	{ name: 'mobile', icon: mobile, label: __( 'Mobile', 'jetpack' ), width: '360px', size: 'sm' },
];

/**
 * The devices the viewport has room to preview, widest first. Desktop is dropped in the
 * 600–960px band, where its width is whatever room is left over anyway.
 *
 * @return The offered devices.
 */
const useAvailablePreviewDevices = (): PreviewDevice[] => {
	// Both hooks must be called unconditionally (rules-of-hooks), so avoid &&-short-circuiting them.
	const isAtLeastSmall = useViewportMatch( 'small' );
	const isBelowLarge = useViewportMatch( 'large', '<' );
	const isMedium = isAtLeastSmall && isBelowLarge;

	return isMedium ? previewDevices.filter( device => device.size !== 'lg' ) : previewDevices;
};

interface PreviewDeviceSelectorProps {
	devices: PreviewDevice[];
	selectedDevice: PreviewDeviceName;
	setSelectedDevice: ( device: PreviewDeviceName ) => void;
}

const PreviewDeviceSelector = ( {
	devices,
	selectedDevice,
	setSelectedDevice,
}: PreviewDeviceSelectorProps ) => {
	const isSmall = useViewportMatch( 'small', '<' );
	const { tracks } = useAnalytics();

	const handleDeviceChange = ( device: PreviewDeviceName ) => {
		tracks.recordEvent( 'jetpack_newsletter_preview_device_change', { device } );
		setSelectedDevice( device );
	};

	if ( isSmall ) {
		return null;
	}

	return (
		// Remount when the options change: the highlight only re-measures when the selected
		// option resizes, so a moved option would leave it on the old position.
		<ToggleGroupControl
			key={ devices.map( device => device.name ).join() }
			__nextHasNoMarginBottom
			label={ __( 'Preview device', 'jetpack' ) }
			hideLabelFromVision
			onChange={ handleDeviceChange }
			value={ selectedDevice }
			isBlock
			__next40pxDefaultSize={ true }
		>
			{ devices.map( device => (
				<ToggleGroupControlOptionIcon
					key={ device.name }
					icon={ device.icon }
					value={ device.name }
					label={ device.label }
				/>
			) ) }
		</ToggleGroupControl>
	);
};

type AccessLevelKey = 'subscribers' | 'paid_subscribers';

interface PreviewAccessSelectorProps {
	selectedAccess: AccessLevelKey;
	setSelectedAccess: ( access: AccessLevelKey ) => void;
}

const PreviewAccessSelector = ( {
	selectedAccess,
	setSelectedAccess,
}: PreviewAccessSelectorProps ) => {
	const isSmall = useViewportMatch( 'small', '<' );
	const postType = useSelect( selectFn => selectFn( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );
	const { tracks } = useAnalytics();

	const isPaidAccess = accessLevel === accessOptions.paid_subscribers.key;

	if ( ! isPaidAccess ) {
		return null;
	}

	const accessOptionsList = [
		{ label: accessOptions.subscribers.label, value: accessOptions.subscribers.key, icon: people },
		{
			label: accessOptions.paid_subscribers.label,
			value: accessOptions.paid_subscribers.key,
			icon: currencyDollar,
		},
	];

	const handleChange = ( value: AccessLevelKey ) => {
		tracks.recordEvent( 'jetpack_newsletter_preview_access_change', { access: value } );
		setSelectedAccess( value );
	};

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			label={ __( 'Preview access level', 'jetpack' ) }
			hideLabelFromVision
			onChange={ handleChange }
			value={ selectedAccess }
			isBlock
			isAdaptiveWidth
			__next40pxDefaultSize={ true }
		>
			{ accessOptionsList.map( access =>
				isSmall ? (
					<ToggleGroupControlOptionIcon
						key={ access.value }
						value={ access.value }
						icon={ access.icon }
						label={ access.label }
					/>
				) : (
					<ToggleGroupControlOption
						key={ access.value }
						value={ access.value }
						label={ access.label }
					/>
				)
			) }
		</ToggleGroupControl>
	);
};

/**
 * Link out to the email design screen, for the creator who looks at the preview and wants the
 * email to look different.
 *
 * In this tab, with a `return` arg so the design screen's Back button comes back to the post:
 * testers lost the post behind a new tab they had not noticed open. A post still holding unsaved
 * edits keeps the new tab, because `__unstableSaveForPreview()` -- which the modal ran on open --
 * only autosaves an already-published post, so leaving would strand those edits.
 *
 * The post travels as `post_id` so the design screen's canvas previews the post the reader was
 * just looking at rather than the sample one. The design being edited stays site-wide. NL-1051.
 *
 * @param props        - Component props.
 * @param props.postId - The post being previewed, for the canvas and the Tracks event.
 * @return The link, or null on a site with no design screen.
 */
const EmailDesignLink = ( { postId }: { postId: number } ) => {
	const { tracks } = useAnalytics();
	const isBelowLarge = useViewportMatch( 'large', '<' );
	// Subscribed rather than read once, so the link follows the modal's own save on open.
	const isPostDirty = useSelect( selectFn => selectFn( editorStore ).isEditedPostDirty(), [] );
	const emailDesignUrl = getScriptData()?.newsletter?.emailDesignUrl;

	const handleClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_newsletter_preview_modal_email_design_click', {
			post_id: postId,
		} );
	}, [ tracks, postId ] );

	if ( ! emailDesignUrl ) {
		return null;
	}

	const label = __( 'Edit email design', 'jetpack' );
	// A new tab must not carry `return`: it would open the post in a second editor with no lock
	// warning between them, as `wp_check_post_lock()` is silent when both are the same user.
	const inNewTab = isPostDirty;
	// `source` is sent unconditionally, unlike the other two: with an unsaved post that has no id
	// this link is otherwise bare, and the screen could not tell it from the Appearance menu.
	const href = addQueryArgs( emailDesignUrl, {
		...( postId > 0 ? { post_id: postId } : {} ),
		...( inNewTab ? {} : { return: window.location.href } ),
		source: 'preview_modal',
	} );

	// The icon carries at every size so it becomes familiar; below `large` it carries alone,
	// because a label there clips the modal title on a site that also shows the audience toggle.
	return (
		<Link
			openInNewTab={ inNewTab }
			href={ href }
			onClick={ handleClick }
			className="jetpack-newsletter-preview-modal__design-link"
			title={ isBelowLarge ? label : undefined }
		>
			<Icon icon={ styles } size={ 24 } />
			{ /* Hidden rather than an `aria-label`, which would override the contents and take
			     `Link`'s own new-tab notice, where it shows one, out of the accessible name with it. */ }
			{ isBelowLarge ? (
				<VisuallyHidden>{ label }</VisuallyHidden>
			) : (
				<span className="jetpack-newsletter-preview-modal__design-link-label">{ label }</span>
			) }
		</Link>
	);
};

interface PreviewControlsProps extends PreviewAccessSelectorProps, PreviewDeviceSelectorProps {
	postId: number;
}

const PreviewControls = ( {
	devices,
	selectedAccess,
	setSelectedAccess,
	selectedDevice,
	setSelectedDevice,
	postId,
}: PreviewControlsProps ) => {
	const isSmall = useViewportMatch( 'small', '<' );

	return (
		<HStack alignment="center" spacing={ isSmall ? 2 : 6 }>
			<PreviewDeviceSelector
				devices={ devices }
				selectedDevice={ selectedDevice }
				setSelectedDevice={ setSelectedDevice }
			/>
			<PreviewAccessSelector
				selectedAccess={ selectedAccess }
				setSelectedAccess={ setSelectedAccess }
			/>
			<EmailDesignLink postId={ postId } />
		</HStack>
	);
};

interface NewsletterPreviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	postId: number;
}

export function NewsletterPreviewModal( { isOpen, onClose, postId }: NewsletterPreviewModalProps ) {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isError, setError ] = useState( false );
	const [ errorCode, setErrorCode ] = useState< string | null >( null );
	const [ refetchedOnError, setRefetchedOnError ] = useState( false );
	const [ previewCache, setPreviewCache ] = useState< Record< string, string > >( {} );
	const [ selectedAccess, setSelectedAccess ] = useState< AccessLevelKey >(
		accessOptions.subscribers.key as AccessLevelKey
	);
	const [ selectedDevice, setSelectedDevice ] = useState< PreviewDeviceName >( 'desktop' );
	const { tracks } = useAnalytics();

	// The viewport can withdraw the selected device mid-session, so the preview follows what is
	// on offer. The stored pick is left alone, to be honoured again if the viewport widens.
	const availableDevices = useAvailablePreviewDevices();
	const effectiveDevice =
		availableDevices.find( device => device.name === selectedDevice ) ?? availableDevices[ 0 ];

	// To avoid duplicate fetches for the same access level, keep track of which access levels are currently being fetched. This is a ref so that it persists across renders without triggering re-renders.
	const fetchingAccessLevelsRef = useRef< Set< AccessLevelKey > >( new Set() );
	const fetchPreview = useCallback(
		async ( accessLevel: AccessLevelKey ) => {
			if ( ! postId || fetchingAccessLevelsRef.current.has( accessLevel ) ) {
				return;
			}
			fetchingAccessLevelsRef.current.add( accessLevel );

			setIsLoading( true );
			setError( false );
			setErrorCode( null );

			try {
				const response = await apiFetch< { html?: string } >( {
					path: `/wpcom/v2/email-preview/?post_id=${ postId }&access=${ accessLevel }`,
					method: 'GET',
				} );

				if ( response && response.html ) {
					setPreviewCache( prevCache => ( {
						...prevCache,
						[ accessLevel ]: response.html,
					} ) );
				} else {
					throw new Error( 'Invalid response format' );
				}
			} catch ( e ) {
				tracks.recordEvent( 'jetpack_newsletter_preview_modal_error' );
				setError( true );
				setErrorCode( ( e as { code?: string } )?.code ?? null );
			} finally {
				setIsLoading( false );
				fetchingAccessLevelsRef.current.delete( accessLevel );
			}
		},
		[ postId, tracks ]
	);

	const { __unstableSaveForPreview } = useDispatch( editorStore );
	// Keep track of the promise returned by __unstableSaveForPreview so that we don't trigger multiple saves when the modal is opened multiple times. This is a ref so that it persists across renders without triggering re-renders.
	const saveForPreviewPromiseRef = useRef< Promise< unknown > | null >( null );
	const cachedPreviewHtml = previewCache[ selectedAccess ];
	useEffect( () => {
		// If the modal is closed, clear the ref so a subsequent open will trigger a save if needed.
		if ( ! isOpen ) {
			saveForPreviewPromiseRef.current = null;
			return;
		}

		// If the preview for the selected access level is already cached, don't fetch it again.
		if ( cachedPreviewHtml !== undefined ) {
			setIsLoading( false );
			return;
		}

		let cancelled = false;
		if ( ! saveForPreviewPromiseRef.current ) {
			const isPostDirty = select( editorStore ).isEditedPostDirty();
			saveForPreviewPromiseRef.current = isPostDirty
				? __unstableSaveForPreview().catch( () => {
						// Best-effort: still show a preview even if the save failed (e.g.
						// post lock) — that's at worst the pre-fix behavior, not a new failure.
					} )
				: Promise.resolve();
		}

		saveForPreviewPromiseRef.current.then( () => {
			if ( cancelled ) {
				return;
			}

			fetchPreview( selectedAccess );
		} );

		return (): void => {
			cancelled = true;
		};
	}, [ isOpen, selectedAccess, cachedPreviewHtml, fetchPreview, __unstableSaveForPreview ] );

	useEffect( () => {
		if ( isOpen ) {
			tracks.recordEvent( 'jetpack_newsletter_preview_modal_open', { post_id: postId } );
		}
	}, [ isOpen, postId, tracks ] );

	const handleClose = () => {
		tracks.recordEvent( 'jetpack_newsletter_preview_modal_close', { post_id: postId } );
		onClose();
		setPreviewCache( {} );
	};

	return (
		isOpen && (
			<Modal
				isFullScreen={ true }
				title={ __( 'Preview email', 'jetpack' ) }
				onRequestClose={ handleClose }
				headerActions={
					<PreviewControls
						devices={ availableDevices }
						selectedAccess={ selectedAccess }
						setSelectedAccess={ setSelectedAccess }
						selectedDevice={ effectiveDevice.name }
						setSelectedDevice={ setSelectedDevice }
						postId={ postId }
					/>
				}
				className="jetpack-newsletter-preview-modal"
			>
				<div
					style={ {
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						height: 'calc(100vh - 190px)',
						backgroundColor: isError ? '#fff' : '#ddd',
						paddingTop: effectiveDevice.name !== 'desktop' ? '36px' : '0',
						transition: 'padding 0.3s ease-in-out',
					} }
				>
					{ isLoading && <Spinner /> }
					{ isError && errorCode === MISSING_CONNECTION_ERROR_CODE && (
						<VStack
							alignment="center"
							aria-live="polite"
							role="alert"
							style={ { textAlign: 'center' } }
						>
							<Icon icon={ warning } />
							<h3>{ __( 'Connect your account to preview this email', 'jetpack' ) }</h3>
							<MissingConnectionNotice />
						</VStack>
					) }
					{ isError && errorCode !== MISSING_CONNECTION_ERROR_CODE && (
						<VStack
							alignment="center"
							aria-live="polite"
							role="alert"
							style={ { textAlign: 'center' } }
						>
							<Icon icon={ warning } />
							<h3>{ __( 'Oops, something went wrong showing the preview…', 'jetpack' ) }</h3>
							<Button
								onClick={ () => {
									setRefetchedOnError( true );
									fetchPreview( selectedAccess );
								} }
								variant="primary"
							>
								{ __( 'Try again', 'jetpack' ) }
							</Button>
							{ refetchedOnError && (
								<p>
									{ createInterpolateElement(
										__(
											'If the issue persists, please <supportLink>contact support</supportLink>.',
											'jetpack'
										),
										{
											supportLink: (
												<Link openInNewTab href={ getRedirectUrl( 'jetpack-support' ) } />
											),
										}
									) }
								</p>
							) }
						</VStack>
					) }
					{ ! isLoading && ! isError && (
						<iframe
							sandbox=""
							srcDoc={ previewCache?.[ selectedAccess ] }
							style={ {
								width: effectiveDevice.width,
								maxWidth: '100%',
								height: '100%',
								border: 'none',
								transition: 'width 0.3s ease-in-out',
							} }
							title={ __( 'Email Preview', 'jetpack' ) }
						/>
					) }
				</div>
			</Modal>
		)
	);
}

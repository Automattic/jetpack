import { getRedirectUrl } from '@automattic/jetpack-components';
import { getUserConnectionUrl, useConnection } from '@automattic/jetpack-connection';
import { isSimpleSite } from '@automattic/jetpack-script-data';
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
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useEffect, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	desktop,
	mobile,
	tablet,
	check,
	people,
	currencyDollar,
	cautionFilled as warning,
} from '@wordpress/icons';
import { Link } from '@wordpress/ui';
import './email-preview.scss';
import { accessOptions } from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { SendIcon } from './icons';

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
 *
 * @return {Element} The connection prompt.
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

export function NewsletterTestEmailModal( { isOpen, onClose } ) {
	const [ isEmailSent, setIsEmailSent ] = useState( false );
	const [ isEmailSending, setIsEmailSending ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ recipientEmail, setRecipientEmail ] = useState(
		() => window?.Jetpack_Editor_Initial_State?.tracksUserData?.email ?? ''
	);
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
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
			.catch( e => {
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
										/* dummy arg to avoid bad minification */ 0
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
							<Grid alignment="bottom" columns={ 2 } gap={ 2 } templateColumns="2fr auto;">
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
									isBusy={ isEmailSending }
									disabled={ shouldPromptForConnection }
									__next40pxDefaultSize={ true }
								>
									{ __( 'Send', 'jetpack' ) }
									<Icon icon={ SendIcon } />
								</Button>
							</Grid>
						</form>
					</>
				) }
			</VStack>
		</Modal>
	);
}

const previewDevices = [
	{ name: 'desktop', icon: desktop, label: __( 'Desktop', 'jetpack' ), width: '100%', size: 'lg' },
	{ name: 'tablet', icon: tablet, label: __( 'Tablet', 'jetpack' ), width: '768px', size: 'md' },
	{ name: 'mobile', icon: mobile, label: __( 'Mobile', 'jetpack' ), width: '360px', size: 'sm' },
];

const PreviewDeviceSelector = ( { selectedDevice, setSelectedDevice } ) => {
	// `md` in the old hook was the 600–959px band: at least small (>=600) AND below large (<960).
	// Both hooks must be called unconditionally (rules-of-hooks), so avoid &&-short-circuiting them.
	const isAtLeastSmall = useViewportMatch( 'small' );
	const isBelowLarge = useViewportMatch( 'large', '<' );
	const isMedium = isAtLeastSmall && isBelowLarge;
	const isSmall = useViewportMatch( 'small', '<' );
	const { tracks } = useAnalytics();

	const handleDeviceChange = device => {
		tracks.recordEvent( 'jetpack_newsletter_preview_device_change', { device } );
		setSelectedDevice( device );
	};

	if ( isSmall ) {
		return null;
	}

	const getAvailableDevices = () =>
		isMedium ? previewDevices.filter( device => device.size !== 'lg' ) : previewDevices;

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			onChange={ handleDeviceChange }
			value={ selectedDevice }
			isBlock
			__next40pxDefaultSize={ true }
		>
			{ getAvailableDevices().map( device => (
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

const PreviewAccessSelector = ( { selectedAccess, setSelectedAccess } ) => {
	const isSmall = useViewportMatch( 'small', '<' );
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
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

	const handleChange = value => {
		tracks.recordEvent( 'jetpack_newsletter_preview_access_change', { access: value } );
		setSelectedAccess( value );
	};

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
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

const PreviewControls = ( {
	selectedAccess,
	setSelectedAccess,
	selectedDevice,
	setSelectedDevice,
} ) => {
	const isSmall = useViewportMatch( 'small', '<' );

	return (
		<HStack alignment="center" spacing={ isSmall ? 1 : 6 }>
			<PreviewDeviceSelector
				selectedDevice={ selectedDevice }
				setSelectedDevice={ setSelectedDevice }
			/>
			<PreviewAccessSelector
				selectedAccess={ selectedAccess }
				setSelectedAccess={ setSelectedAccess }
			/>
		</HStack>
	);
};

export function NewsletterPreviewModal( { isOpen, onClose, postId } ) {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isError, setError ] = useState( false );
	const [ errorCode, setErrorCode ] = useState( null );
	const [ refetchedOnError, setRefetchedOnError ] = useState( false );
	const [ previewCache, setPreviewCache ] = useState( {} );
	const [ selectedAccess, setSelectedAccess ] = useState( accessOptions.subscribers.key );
	const [ selectedDevice, setSelectedDevice ] = useState( 'desktop' );
	const { tracks } = useAnalytics();

	const fetchPreview = useCallback(
		async accessLevel => {
			if ( ! postId ) {
				return;
			}

			setIsLoading( true );
			setError( false );
			setErrorCode( null );

			try {
				const response = await apiFetch( {
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
				setErrorCode( e?.code ?? null );
			} finally {
				setIsLoading( false );
			}
		},
		[ postId, tracks ]
	);

	useEffect( () => {
		if ( isOpen && ! Object.hasOwn( previewCache, selectedAccess ) ) {
			fetchPreview( selectedAccess );
		} else if ( isOpen ) {
			setIsLoading( false );
		}
	}, [ isOpen, selectedAccess, fetchPreview, previewCache ] );

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

	const deviceWidth = previewDevices.find( device => device.name === selectedDevice ).width;

	return (
		isOpen && (
			<Modal
				isFullScreen={ true }
				title={ __( 'Preview email', 'jetpack' ) }
				onRequestClose={ handleClose }
				headerActions={
					<PreviewControls
						selectedAccess={ selectedAccess }
						setSelectedAccess={ setSelectedAccess }
						selectedDevice={ selectedDevice }
						setSelectedDevice={ setSelectedDevice }
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
						paddingTop: selectedDevice !== 'desktop' ? '36px' : '0',
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
							srcDoc={ previewCache?.[ selectedAccess ] }
							style={ {
								width: deviceWidth,
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

import { getRedirectUrl, useBreakpointMatch } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	__experimentalGrid as Grid, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Modal,
	__experimentalInputControl as InputControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Icon,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Spinner,
	ExternalLink,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useEffect, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { desktop, mobile, tablet, check, people, currencyDollar, warning } from '@wordpress/icons';
import './email-preview.scss';
import { accessOptions } from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { SendIcon } from './icons';

export function NewsletterTestEmailModal( { isOpen, onClose } ) {
	const [ isEmailSent, setIsEmailSent ] = useState( false );
	const [ isEmailSending, setIsEmailSending ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( false );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
	const { __unstableSaveForPreview } = useDispatch( editorStore );
	const { tracks } = useAnalytics();

	const sendTestEmail = async () => {
		tracks.recordEvent( 'jetpack_newsletter_test_email_send', { post_id: postId } );
		setIsEmailSending( true );
		await __unstableSaveForPreview();

		apiFetch( {
			path: '/wpcom/v2/send-email-preview/',
			method: 'POST',
			data: { id: postId },
		} )
			.then( () => {
				setIsEmailSending( false );
				setIsEmailSent( true );
			} )
			.catch( e => {
				setIsEmailSending( false );
				setErrorMessage(
					e.message ||
						__( 'Whoops, we have encountered an error. Please try again later.', 'jetpack' )
				);
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
				{ errorMessage && <p>{ errorMessage } </p> }
				{ isEmailSent ? (
					<HStack alignment="left" className="jetpack-newsletter-test-email-modal__email-sent">
						<Icon icon={ check } size={ 28 } />
						<p>{ __( 'Email sent successfully', 'jetpack' ) }</p>
					</HStack>
				) : (
					<>
						<p>
							{ __(
								'This will send you an email, allowing you to see exactly what your subscribers receive in their inboxes.',
								'jetpack'
							) }
						</p>
						<Grid alignment="bottom" columns={ 2 } gap={ 2 } templateColumns="2fr auto;">
							<InputControl
								value={ window?.Jetpack_Editor_Initial_State?.tracksUserData?.email }
								disabled
								__next40pxDefaultSize={ true }
							/>
							<Button
								variant="primary"
								onClick={ sendTestEmail }
								isBusy={ isEmailSending }
								__next40pxDefaultSize={ true }
							>
								{ __( 'Send', 'jetpack' ) }
								<Icon icon={ SendIcon } />
							</Button>
						</Grid>
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
	const [ isMedium ] = useBreakpointMatch( 'md' );
	const [ isSmall ] = useBreakpointMatch( 'sm' );
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
	const [ isSmall ] = useBreakpointMatch( 'sm' );
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
	const [ isSmall ] = useBreakpointMatch( 'sm' );

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
			} catch {
				tracks.recordEvent( 'jetpack_newsletter_preview_modal_error' );
				setError( true );
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
					{ isError && (
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
											supportLink: <ExternalLink href={ getRedirectUrl( 'jetpack-support' ) } />,
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

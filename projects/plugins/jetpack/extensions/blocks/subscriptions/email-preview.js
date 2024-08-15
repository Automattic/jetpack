import { useBreakpointMatch } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Modal,
	TextControl,
	Icon,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	Spinner,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { desktop, mobile, tablet, check, people, currencyDollar } from '@wordpress/icons';
import './email-preview.scss';
import { useCallback, useEffect } from 'react';
import { accessOptions } from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import illustration from './email-preview-illustration.svg';

export function EmailPreview( { isModalOpen, closeModal } ) {
	const [ emailSent, setEmailSent ] = useState( false );
	const [ emailSending, setEmailSending ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( false );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
	const { __unstableSaveForPreview } = useDispatch( editorStore );
	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const { tracks } = useAnalytics();

	const sendEmailPreview = async () => {
		tracks.recordEvent( 'jetpack_send_email_preview', {
			post_id: postId,
		} );

		setEmailSending( true );

		// Save post revision so that we send what they see in the editor, and not what previous draft/revision might've saved
		// Introduced at GB 16.3 at https://github.com/WordPress/gutenberg/pull/44971
		await __unstableSaveForPreview();

		apiFetch( {
			path: '/wpcom/v2/send-email-preview/',
			method: 'POST',
			data: {
				id: postId,
			},
		} )
			.then( () => {
				setEmailSending( false );
				setEmailSent( true );
			} )
			.catch( e => {
				setEmailSending( false );
				if ( e.message ) {
					setErrorMessage( e.message );
				} else {
					setErrorMessage(
						__( 'Whoops, we have encountered an error. Please try again later.', 'jetpack' )
					);
				}
			} );
	};

	return (
		<>
			{ isModalOpen && (
				<Modal
					className="jetpack-email-preview"
					onRequestClose={ () => {
						closeModal();
						setEmailSent( false );
					} }
				>
					<HStack alignment="topLeft">
						<VStack className="jetpack-email-preview__main" alignment="topLeft">
							<h1 className="jetpack-email-preview__title">
								{ __( 'Send a test email', 'jetpack' ) }
							</h1>
							{ errorMessage && (
								<HStack className="jetpack-email-preview__email-sent">{ errorMessage }</HStack>
							) }
							{ emailSent ? (
								<HStack className="jetpack-email-preview__email-sent">
									<Icon className="jetpack-email-preview__check" icon={ check } size={ 28 } />
									<div className="jetpack-email-preview__sent_text">
										{ __( 'Email sent successfully', 'jetpack' ) }
									</div>
								</HStack>
							) : (
								<HStack>
									<TextControl
										className="jetpack-email-preview__email"
										value={ window?.Jetpack_Editor_Initial_State?.tracksUserData?.email }
										disabled
									/>
									<Button
										className="jetpack-email-preview__button"
										variant="primary"
										onClick={ sendEmailPreview }
										isBusy={ emailSending }
									>
										{ __( 'Send', 'jetpack' ) }
									</Button>
								</HStack>
							) }
						</VStack>
						{ ! isSmall && (
							<img className="jetpack-email-preview__img" src={ illustration } alt="" />
						) }
					</HStack>
				</Modal>
			) }
		</>
	);
}

const devices = [
	{
		name: 'desktop',
		icon: desktop,
		label: __( 'Desktop', 'jetpack' ),
		width: '100%',
		size: 'lg',
	},
	{
		name: 'tablet',
		icon: tablet,
		label: __( 'Tablet', 'jetpack' ),
		width: '768px',
		size: 'md',
	},
	{
		name: 'mobile',
		icon: mobile,
		label: __( 'Mobile', 'jetpack' ),
		width: '360px',
		size: 'sm',
	},
];

const DevicePicker = ( { selectedDevice, setSelectedDevice } ) => {
	const [ isMedium ] = useBreakpointMatch( 'md' );
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	if ( isSmall ) {
		return null;
	}

	const getAvailableDevices = () => {
		if ( isMedium ) {
			return devices.filter( device => device.size !== 'lg' );
		}
		return devices;
	};

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			onChange={ setSelectedDevice }
			value={ selectedDevice }
			isBlock
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

const AccessPicker = ( { selectedAccess, setSelectedAccess } ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );

	const isPaidOptionDisabled = ! accessLevel || accessLevel !== accessOptions.paid_subscribers.key;

	const accessOptionsList = [
		{
			label: accessOptions.subscribers.label,
			value: accessOptions.subscribers.key,
			icon: people,
		},
		{
			label: accessOptions.paid_subscribers.label,
			value: accessOptions.paid_subscribers.key,
			icon: currencyDollar,
			disabled: isPaidOptionDisabled,
		},
	];

	const handleChange = value => {
		if ( ! isPaidOptionDisabled ) {
			setSelectedAccess( value );
		}
	};

	if ( isSmall && isPaidOptionDisabled ) {
		return null;
	}

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			onChange={ handleChange }
			value={ selectedAccess }
			isBlock
			isAdaptiveWidth
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
						disabled={ access.disabled }
					/>
				)
			) }
		</ToggleGroupControl>
	);
};

const HeaderActions = ( {
	selectedAccess,
	setSelectedAccess,
	selectedDevice,
	setSelectedDevice,
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<HStack alignment="center" spacing={ isSmall ? 1 : 6 }>
			<DevicePicker selectedDevice={ selectedDevice } setSelectedDevice={ setSelectedDevice } />
			<AccessPicker selectedAccess={ selectedAccess } setSelectedAccess={ setSelectedAccess } />
		</HStack>
	);
};

export function PreviewModal( { isOpen, onClose, postId } ) {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ previewCache, setPreviewCache ] = useState( {} );
	const [ selectedAccess, setSelectedAccess ] = useState( accessOptions.subscribers.key );
	const [ selectedDevice, setSelectedDevice ] = useState( 'desktop' );

	const fetchPreview = useCallback(
		async accessLevel => {
			if ( ! postId ) {
				return;
			}

			setIsLoading( true );

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
			} catch ( error ) {
				setPreviewCache( prevCache => ( {
					...prevCache,
					[ accessLevel ]: `<html><body>${ __(
						'Error loading preview',
						'jetpack'
					) }</body></html>`,
				} ) );
			} finally {
				setIsLoading( false );
			}
		},
		[ postId ]
	);

	useEffect( () => {
		if ( isOpen && ! previewCache.hasOwnProperty( selectedAccess ) ) {
			fetchPreview( selectedAccess );
		} else if ( isOpen ) {
			setIsLoading( false );
		}
	}, [ isOpen, selectedAccess, fetchPreview, previewCache ] );

	const deviceWidth = devices.find( device => device.name === selectedDevice ).width;

	return (
		isOpen && (
			<Modal
				isFullScreen={ true }
				title={ __( 'Preview email', 'jetpack' ) }
				onRequestClose={ () => {
					onClose();
					setPreviewCache( {} );
				} }
				headerActions={
					<HeaderActions
						selectedAccess={ selectedAccess }
						setSelectedAccess={ setSelectedAccess }
						selectedDevice={ selectedDevice }
						setSelectedDevice={ setSelectedDevice }
					/>
				}
				className="jetpack-email-preview-modal"
			>
				<div
					style={ {
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						height: 'calc(100vh - 190px)',
						backgroundColor: '#ddd',
						paddingTop: selectedDevice !== 'desktop' ? '36px' : '0',
						transition: 'padding 0.3s ease-in-out',
					} }
				>
					{ isLoading ? (
						<Spinner />
					) : (
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

export default EmailPreview;

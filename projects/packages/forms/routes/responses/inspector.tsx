/**
 * External dependencies
 */
import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import apiFetch from '@wordpress/api-fetch';
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
	Button,
	ExternalLink,
	Modal,
	Spinner,
	Tip,
	Tooltip,
} from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import { chevronUp, chevronDown, close } from '@wordpress/icons';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
import * as React from 'react';
/**
 * Internal dependencies
 */
import CopyClipboardButton from '../../src/dashboard/components/copy-clipboard-button';
import Flag from '../../src/dashboard/components/flag';
import Gravatar from '../../src/dashboard/components/gravatar';
import { store as dashboardStore } from '../../src/dashboard/store';
import type { DispatchActions, SelectActions } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../src/types/index.ts';

const getDisplayName = ( response: FormResponse ) => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip || 'Anonymous' );
};

const isFileUploadField = ( value: unknown ): boolean => {
	return !! value && typeof value === 'object' && 'files' in value;
};

const isImageSelectField = ( value: unknown ): boolean => {
	return !! value && typeof value === 'object' && 'type' in value && value.type === 'image-select';
};

const isLikelyPhoneNumber = ( value: unknown ): boolean => {
	if ( typeof value !== 'string' ) {
		return false;
	}

	const normalizedValue = value.trim();

	if ( ! /^[\d+\-\s().]+$/.test( normalizedValue ) ) {
		return false;
	}

	if ( /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test( normalizedValue ) ) {
		return false;
	}
	if ( /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test( normalizedValue ) ) {
		return false;
	}

	const digits = normalizedValue.replace( /\D/g, '' );
	if ( digits.length < 7 || digits.length > 15 ) {
		return false;
	}

	return true;
};

/**
 * Renders a preview of an image file.
 *
 * @param props               - Props used while rendering the preview.
 * @param props.file          - The image file object.
 * @param props.file.url      - The URL of the image file.
 * @param props.file.name     - The name of the image file.
 * @param props.isLoading     - Whether the preview is currently loading.
 * @param props.onImageLoaded - Callback fired when the image finishes loading.
 *
 * @return                    - Element containing the file preview.
 */
function PreviewFile( {
	file,
	isLoading,
	onImageLoaded,
}: {
	file: { url: string; name: string };
	isLoading: boolean;
	onImageLoaded: () => void;
} ) {
	return (
		<div style={ { position: 'relative', minHeight: '200px' } }>
			{ isLoading && (
				<div
					style={ {
						position: 'absolute',
						inset: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'column',
						gap: '8px',
					} }
				>
					<Spinner />
					<span>{ __( 'Loading preview…', 'jetpack-forms' ) }</span>
				</div>
			) }
			<img
				src={ file.url }
				alt={ decodeEntities( file.name ) }
				onLoad={ onImageLoaded }
				style={ {
					maxWidth: '100%',
					opacity: isLoading ? 0 : 1,
					transition: 'opacity 0.2s',
				} }
			/>
		</div>
	);
}

type UploadedFile = {
	url: string;
	name: string;
	is_image?: boolean;
};

/**
 * Renders a list of uploaded files.
 *
 * @param props                   - Props used while rendering the list of uploaded files.
 * @param props.files             - The list of uploaded files.
 * @param props.handleFilePreview - Callback fired when a file is clicked.
 *
 * @return                        - Element containing the list of uploaded files.
 */
function FieldFile( {
	files,
	handleFilePreview,
}: {
	files: Array< UploadedFile >;
	handleFilePreview: ( file: UploadedFile ) => () => void;
} ) {
	return (
		<ul style={ { margin: 0, paddingLeft: '20px' } }>
			{ files.map( ( file, index ) => (
				<li key={ index }>
					{ file.is_image ? (
						<Button variant="link" onClick={ handleFilePreview( file ) }>
							{ decodeEntities( file.name ) }
						</Button>
					) : (
						<ExternalLink href={ file.url }>{ decodeEntities( file.name ) }</ExternalLink>
					) }
				</li>
			) ) }
		</ul>
	);
}

/**
 * Renders an email address.
 *
 * @param props       - Props used while rendering the email address.
 * @param props.email - The email address to render.
 *
 * @return            - Element containing the email address.
 */
function FieldEmail( { email }: { email: string } ) {
	return (
		<span style={ { display: 'inline-flex', alignItems: 'center', gap: '4px' } }>
			<a href={ `mailto:${ email }` }>{ email }</a>
			<CopyClipboardButton text={ email } />
		</span>
	);
}

type ImageSelectChoice = {
	url: string;
	name: string;
	selected?: boolean;
};

/**
 * Creates a handler for the enter key.
 *
 * @param handler - The handler to call when the enter key is pressed.
 *
 * @return        - Function that handles the enter key press.
 */
function createEnterKeyHandler( handler: () => void ) {
	return function handleEnterKeyDown( event: React.KeyboardEvent< HTMLDivElement > ) {
		if ( event.key === 'Enter' ) {
			handler();
		}
	};
}

/**
 * Renders a list of image choices.
 *
 * @param props                   - Props used while rendering the list of image choices.
 * @param props.choices           - The list of image choices.
 * @param props.handleFilePreview - Callback fired when a image choice is clicked.
 *
 * @return                        - Element containing the list of image choices.
 */
function FieldImageSelect( {
	choices,
	handleFilePreview,
}: {
	choices: Array< ImageSelectChoice >;
	handleFilePreview: ( choice: ImageSelectChoice ) => () => void;
} ) {
	return (
		<div style={ { display: 'flex', gap: '8px', flexWrap: 'wrap' } }>
			{ choices.map( ( choice, index ) => {
				const previewHandler = handleFilePreview( choice );
				const keyDownHandler = createEnterKeyHandler( previewHandler );

				return (
					<div
						key={ index }
						style={ {
							border: choice.selected ? '2px solid var(--wp-admin-theme-color)' : '1px solid #ddd',
							borderRadius: '4px',
							padding: '4px',
							cursor: 'pointer',
						} }
						onClick={ previewHandler }
						onKeyDown={ keyDownHandler }
						role="button"
						tabIndex={ 0 }
					>
						<img
							src={ choice.url }
							alt={ choice.name }
							style={ { width: '60px', height: '60px', objectFit: 'cover' } }
						/>
					</div>
				);
			} ) }
		</div>
	);
}

/**
 * Renders the actions for a response.
 *
 * @param props                  - Props used while rendering the actions for a response.
 * @param props.response         - The response to render the actions for.
 * @param props.onActionComplete - Callback fired when an action is completed.
 *
 * @return                       - Element containing the actions for a response.
 */
function ResponseActions( {
	response,
	onActionComplete,
}: {
	response: FormResponse;
	onActionComplete: ( item: FormResponse ) => void;
} ) {
	const { saveEntityRecord, deleteEntityRecord, editEntityRecord } = useDispatch(
		coreStore
	) as DispatchActions;
	const { updateCountsOptimistically, invalidateCounts } = useDispatch(
		dashboardStore
	) as DispatchActions;
	const [ isLoading ] = useState( false );

	const handleMarkAsSpam = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { status: 'spam' } );
		updateCountsOptimistically( originalStatus, 'spam', 1 );
		onActionComplete( { ...response, status: 'spam' } );

		try {
			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'spam',
			} );
			invalidateCounts();
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { status: originalStatus } );
			updateCountsOptimistically( 'spam', originalStatus, 1 );
		}
	}, [
		response,
		saveEntityRecord,
		editEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleMarkAsNotSpam = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { status: 'publish' } );
		updateCountsOptimistically( originalStatus, 'publish', 1 );
		onActionComplete( { ...response, status: 'publish' } );

		try {
			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'publish',
			} );
			invalidateCounts();
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { status: originalStatus } );
			updateCountsOptimistically( 'publish', originalStatus, 1 );
		}
	}, [
		response,
		saveEntityRecord,
		editEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleMoveToTrash = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { status: 'trash' } );
		updateCountsOptimistically( originalStatus, 'trash', 1 );
		onActionComplete( { ...response, status: 'trash' } );

		try {
			await deleteEntityRecord( 'postType', 'feedback', response.id );
			invalidateCounts();
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { status: originalStatus } );
			updateCountsOptimistically( 'trash', originalStatus, 1 );
		}
	}, [
		response,
		deleteEntityRecord,
		editEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleRestore = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { status: 'publish' } );
		updateCountsOptimistically( originalStatus, 'publish', 1 );
		onActionComplete( { ...response, status: 'publish' } );

		try {
			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'publish',
			} );
			invalidateCounts();
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { status: originalStatus } );
			updateCountsOptimistically( 'publish', originalStatus, 1 );
		}
	}, [
		response,
		saveEntityRecord,
		editEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleDelete = useCallback( async () => {
		const originalStatus = response.status;

		// Optimistic update
		updateCountsOptimistically( originalStatus, '', 1 );
		onActionComplete( response );

		try {
			await deleteEntityRecord( 'postType', 'feedback', response.id, { force: true } );
			invalidateCounts();
		} catch {
			// Revert on error
			updateCountsOptimistically( '', originalStatus, 1 );
		}
	}, [
		response,
		deleteEntityRecord,
		onActionComplete,
		updateCountsOptimistically,
		invalidateCounts,
	] );

	const handleToggleRead = useCallback( async () => {
		const newIsUnread = ! response.is_unread;

		// Optimistic update
		editEntityRecord( 'postType', 'feedback', response.id, { is_unread: newIsUnread } );
		onActionComplete( { ...response, is_unread: newIsUnread } );

		try {
			await apiFetch( {
				path: `/wp/v2/feedback/${ response.id }/read`,
				method: 'POST',
				data: { is_unread: newIsUnread },
			} );
		} catch {
			// Revert on error
			editEntityRecord( 'postType', 'feedback', response.id, { is_unread: ! newIsUnread } );
		}
	}, [ response, editEntityRecord, onActionComplete ] );

	const containerStyle = {
		display: 'flex',
		gap: '4px',
		alignItems: 'center',
		marginLeft: '-12px', // Compensate for button internal padding
	};

	if ( response.status === 'trash' ) {
		return (
			<div style={ containerStyle }>
				<Button onClick={ handleToggleRead } isBusy={ isLoading } size="compact">
					{ response.is_unread
						? __( 'Mark as read', 'jetpack-forms' )
						: __( 'Mark as unread', 'jetpack-forms' ) }
				</Button>
				<Button onClick={ handleRestore } isBusy={ isLoading } size="compact">
					{ __( 'Restore', 'jetpack-forms' ) }
				</Button>
				<Button onClick={ handleDelete } isBusy={ isLoading } size="compact">
					{ __( 'Delete', 'jetpack-forms' ) }
				</Button>
			</div>
		);
	}

	if ( response.status === 'spam' ) {
		return (
			<div style={ containerStyle }>
				<Button onClick={ handleToggleRead } isBusy={ isLoading } size="compact">
					{ response.is_unread
						? __( 'Mark as read', 'jetpack-forms' )
						: __( 'Mark as unread', 'jetpack-forms' ) }
				</Button>
				<Button onClick={ handleMarkAsNotSpam } isBusy={ isLoading } size="compact">
					{ __( 'Not spam', 'jetpack-forms' ) }
				</Button>
				<Button onClick={ handleMoveToTrash } isBusy={ isLoading } size="compact">
					{ __( 'Trash', 'jetpack-forms' ) }
				</Button>
			</div>
		);
	}

	return (
		<div style={ containerStyle }>
			<Button onClick={ handleToggleRead } isBusy={ isLoading } size="compact">
				{ response.is_unread
					? __( 'Mark as read', 'jetpack-forms' )
					: __( 'Mark as unread', 'jetpack-forms' ) }
			</Button>
			<Button onClick={ handleMarkAsSpam } isBusy={ isLoading } size="compact">
				{ __( 'Spam', 'jetpack-forms' ) }
			</Button>
			<Button onClick={ handleMoveToTrash } isBusy={ isLoading } size="compact">
				{ __( 'Trash', 'jetpack-forms' ) }
			</Button>
		</div>
	);
}

/**
 * Renders the navigation for a response.
 *
 * @param props             - Props used while rendering the navigation for a response.
 * @param props.hasNext     - Whether there is a next response.
 * @param props.hasPrevious - Whether there is a previous response.
 * @param props.onNext      - Callback fired when the next response is clicked.
 * @param props.onPrevious  - Callback fired when the previous response is clicked.
 * @param props.onClose     - Callback fired when the navigation is closed.
 *
 * @return                  - Element containing the navigation for a response.
 */
function ResponseNavigation( {
	hasNext,
	hasPrevious,
	onNext,
	onPrevious,
	onClose,
}: {
	hasNext: boolean;
	hasPrevious: boolean;
	onNext: () => void;
	onPrevious: () => void;
	onClose: () => void;
} ) {
	const sharedProps = {
		accessibleWhenDisabled: true,
		iconSize: 24,
		showTooltip: true,
		size: 'compact' as const,
	};

	return (
		<div style={ { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 } }>
			<div style={ { display: 'flex', alignItems: 'center' } }>
				<Button
					{ ...sharedProps }
					disabled={ ! hasPrevious }
					icon={ chevronUp }
					label={ __( 'Previous', 'jetpack-forms' ) }
					onClick={ onPrevious }
				/>
				<Button
					{ ...sharedProps }
					disabled={ ! hasNext }
					icon={ chevronDown }
					label={ __( 'Next', 'jetpack-forms' ) }
					onClick={ onNext }
				/>
				<span
					style={ {
						display: 'inline-block',
						width: '1px',
						height: '20px',
						backgroundColor: 'var(--wp-admin-theme-color-darker-10, #135e96)',
						opacity: 0.2,
						marginLeft: '4px',
					} }
				/>
			</div>
			<Button
				{ ...sharedProps }
				iconSize={ 20 }
				icon={ close }
				label={ __( 'Close', 'jetpack-forms' ) }
				onClick={ onClose }
			/>
		</div>
	);
}

/**
 * Renders a single response.
 *
 * @param props                - Props used while rendering a single response.
 * @param props.responseId     - The ID of the response to render.
 * @param props.allResponseIds - The IDs of all responses.
 * @param props.onNavigate     - Callback fired when the response is navigated.
 * @param props.onClose        - Callback fired when the response is closed.
 *
 * @return                     - Element containing the single response.
 */
function SingleResponseView( {
	responseId,
	allResponseIds,
	onNavigate,
	onClose,
}: {
	responseId: number;
	allResponseIds: number[];
	onNavigate: ( id: number ) => void;
	onClose: () => void;
} ) {
	const [ previewFile, setPreviewFile ] = useState< { url: string; name: string } | null >( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );
	const [ hasMarkedAsRead, setHasMarkedAsRead ] = useState< number | null >( null );

	const { editEntityRecord } = useDispatch( coreStore ) as DispatchActions;

	const { response, isLoading } = useSelect(
		select => {
			if ( ! responseId ) {
				return { response: null, isLoading: false };
			}

			return {
				response: ( select( coreStore ) as SelectActions ).getEntityRecord(
					'postType',
					'feedback',
					responseId
				) as unknown as FormResponse | null,
				isLoading: ( select( coreStore ) as SelectActions ).isResolving( 'getEntityRecord', [
					'postType',
					'feedback',
					responseId,
				] ),
			};
		},
		[ responseId ]
	);

	const currentIndex = allResponseIds.indexOf( responseId );
	const hasNext = currentIndex < allResponseIds.length - 1;
	const hasPrevious = currentIndex > 0;

	const handleNext = useCallback( () => {
		if ( hasNext ) {
			onNavigate( allResponseIds[ currentIndex + 1 ] );
		}
	}, [ hasNext, allResponseIds, currentIndex, onNavigate ] );

	const handlePrevious = useCallback( () => {
		if ( hasPrevious ) {
			onNavigate( allResponseIds[ currentIndex - 1 ] );
		}
	}, [ hasPrevious, allResponseIds, currentIndex, onNavigate ] );

	// Keyboard navigation
	useEffect( () => {
		const handleKeyDown = ( event: KeyboardEvent ) => {
			if ( event.key === 'ArrowUp' && hasPrevious ) {
				event.preventDefault();
				handlePrevious();
			} else if ( event.key === 'ArrowDown' && hasNext ) {
				event.preventDefault();
				handleNext();
			} else if ( event.key === 'Escape' ) {
				onClose();
			}
		};

		window.addEventListener( 'keydown', handleKeyDown );
		return () => window.removeEventListener( 'keydown', handleKeyDown );
	}, [ hasNext, hasPrevious, handleNext, handlePrevious, onClose ] );

	// Mark as read when viewing
	useEffect( () => {
		if ( ! response || ! response.id || ! response.is_unread ) {
			return;
		}
		if ( hasMarkedAsRead === response.id ) {
			return;
		}

		setHasMarkedAsRead( response.id );

		editEntityRecord( 'postType', 'feedback', response.id, {
			is_unread: false,
		} );

		apiFetch( {
			path: `/wp/v2/feedback/${ response.id }/read`,
			method: 'POST',
			data: { is_unread: false },
		} ).catch( () => {
			editEntityRecord( 'postType', 'feedback', response.id, {
				is_unread: true,
			} );
		} );
	}, [ response, editEntityRecord, hasMarkedAsRead ] );

	const handleFilePreview = useCallback(
		( file: { url: string; name: string } ) => () => {
			setIsImageLoading( true );
			setPreviewFile( file );
		},
		[]
	);

	const closePreviewModal = useCallback( () => {
		setPreviewFile( null );
		setIsImageLoading( true );
	}, [] );

	const handleImageLoaded = useCallback( () => {
		setIsImageLoading( false );
	}, [] );

	const handleActionComplete = useCallback(
		( updatedItem: FormResponse | null ) => {
			if ( ! updatedItem ) {
				if ( hasNext ) {
					handleNext();
				} else if ( hasPrevious ) {
					handlePrevious();
				} else {
					onClose();
				}
			}
		},
		[ hasNext, hasPrevious, handleNext, handlePrevious, onClose ]
	);

	const renderFieldValue = ( value: unknown ) => {
		if ( value === null || value === undefined ) {
			return '-';
		}

		if ( isImageSelectField( value ) ) {
			return (
				<FieldImageSelect
					choices={ ( value as { choices: ImageSelectChoice[] } ).choices }
					handleFilePreview={ handleFilePreview }
				/>
			);
		}

		if ( isFileUploadField( value ) ) {
			return (
				<FieldFile
					files={ ( value as { files: UploadedFile[] } ).files }
					handleFilePreview={ handleFilePreview }
				/>
			);
		}

		const emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		if ( typeof value === 'string' && emailRegEx.test( value ) ) {
			return <FieldEmail email={ value } />;
		}

		if ( isLikelyPhoneNumber( value ) ) {
			return <a href={ `tel:${ value }` }>{ value as string }</a>;
		}

		if ( Array.isArray( value ) ) {
			return value.join( ', ' );
		}

		if ( typeof value === 'object' ) {
			return JSON.stringify( value );
		}

		return String( value );
	};

	if ( isLoading ) {
		return (
			<div style={ { display: 'flex', justifyContent: 'center', padding: '40px' } }>
				<Spinner />
			</div>
		);
	}

	if ( ! response ) {
		return (
			<div style={ { padding: '20px' } }>
				<p>{ __( 'Response not found.', 'jetpack-forms' ) }</p>
			</div>
		);
	}

	const displayName = getDisplayName( response );
	const dateSettings = getDateSettings();
	const gravatarEmail = response.author_email || response.ip;
	const defaultImage = response.author_name || response.author_email ? 'initials' : 'mp';
	const responseAuthorEmailParts = response.author_email?.split( '@' ) ?? [];

	return (
		<>
			<div
				style={ {
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '8px 16px',
					borderBottom: '1px solid #e0e0e0',
					gap: '8px',
					flexWrap: 'wrap',
				} }
			>
				<ResponseActions response={ response } onActionComplete={ handleActionComplete } />
				<ResponseNavigation
					hasNext={ hasNext }
					hasPrevious={ hasPrevious }
					onNext={ handleNext }
					onPrevious={ handlePrevious }
					onClose={ onClose }
				/>
			</div>

			<div style={ { padding: '20px', overflowY: 'auto' } }>
				<div style={ { marginBottom: '20px' } }>
					<HStack alignment="topLeft" spacing="3">
						<Gravatar
							email={ gravatarEmail }
							defaultImage={ defaultImage }
							displayName={ displayName }
							size={ 48 }
						/>
						<VStack spacing="0">
							<h3 style={ { margin: 0, fontSize: '16px', fontWeight: 600 } }>{ displayName }</h3>
							{ response.author_email && displayName !== response.author_email && (
								<p style={ { margin: '4px 0 0', color: '#666', fontSize: '13px' } }>
									<a href={ `mailto:${ response.author_email }` }>
										{ responseAuthorEmailParts[ 0 ] }
										<wbr />@{ responseAuthorEmailParts[ 1 ] }
									</a>
									<CopyClipboardButton text={ response.author_email } />
								</p>
							) }
						</VStack>
					</HStack>
				</div>

				<div style={ { marginBottom: '20px' } }>
					<table style={ { width: '100%', borderCollapse: 'collapse', fontSize: '13px' } }>
						<tbody>
							<tr>
								<th
									style={ {
										textAlign: 'left',
										padding: '6px 12px 6px 0',
										fontWeight: 'normal',
										color: '#666',
										width: '100px',
									} }
								>
									{ __( 'Date:', 'jetpack-forms' ) }
								</th>
								<td style={ { padding: '6px 0' } }>
									{ sprintf(
										/* Translators: %1$s is the date, %2$s is the time. */
										__( '%1$s at %2$s', 'jetpack-forms' ),
										dateI18n( dateSettings.formats.date, response.date ),
										dateI18n( dateSettings.formats.time, response.date )
									) }
								</td>
							</tr>
							<tr>
								<th
									style={ {
										textAlign: 'left',
										padding: '6px 12px 6px 0',
										fontWeight: 'normal',
										color: '#666',
									} }
								>
									{ __( 'Source:', 'jetpack-forms' ) }
								</th>
								<td style={ { padding: '6px 0' } }>
									{ response.entry_permalink ? (
										<ExternalLink href={ response.entry_permalink }>
											{ decodeEntities( response.entry_title ) || response.entry_permalink }
										</ExternalLink>
									) : (
										decodeEntities( response.entry_title ) || __( 'Unknown', 'jetpack-forms' )
									) }
								</td>
							</tr>
							{ response.ip && (
								<tr>
									<th
										style={ {
											textAlign: 'left',
											padding: '6px 12px 6px 0',
											fontWeight: 'normal',
											color: '#666',
										} }
									>
										{ __( 'IP address:', 'jetpack-forms' ) }
									</th>
									<td style={ { padding: '6px 0' } }>
										{ response.country_code && (
											<span style={ { marginRight: '6px' } }>
												<Flag countryCode={ response.country_code } />
											</span>
										) }
										<Tooltip text={ __( 'Lookup IP address', 'jetpack-forms' ) }>
											<ExternalLink href={ getRedirectUrl( 'ip-lookup', { path: response.ip } ) }>
												{ response.ip }
											</ExternalLink>
										</Tooltip>
									</td>
								</tr>
							) }
							{ response.browser && (
								<tr>
									<th
										style={ {
											textAlign: 'left',
											padding: '6px 12px 6px 0',
											fontWeight: 'normal',
											color: '#666',
										} }
									>
										{ __( 'Browser:', 'jetpack-forms' ) }
									</th>
									<td style={ { padding: '6px 0' } }>{ response.browser }</td>
								</tr>
							) }
						</tbody>
					</table>
				</div>

				{ response.fields && Object.keys( response.fields ).length > 0 && (
					<div>
						{ Object.entries( response.fields ).map( ( [ key, value ] ) => (
							<div
								key={ key }
								style={ {
									marginBottom: '16px',
									paddingBottom: '16px',
									borderBottom: '1px solid #eee',
								} }
							>
								<div
									style={ {
										fontWeight: 600,
										marginBottom: '6px',
										color: '#1e1e1e',
										fontSize: '13px',
									} }
								>
									{ key.endsWith( '?' ) ? key : `${ key }:` }
								</div>
								<div style={ { color: '#3c434a', fontSize: '14px' } }>
									{ renderFieldValue( value ) }
								</div>
							</div>
						) ) }
					</div>
				) }

				{ response.status === 'spam' && (
					<div style={ { marginTop: '20px' } }>
						<Tip>
							{ __( 'Spam responses are permanently deleted after 15 days.', 'jetpack-forms' ) }
						</Tip>
					</div>
				) }

				{ response.status === 'trash' && (
					<div style={ { marginTop: '20px' } }>
						<Tip>
							{ _n(
								'Items in trash are permanently deleted after 30 days.',
								'Items in trash are permanently deleted after 30 days.',
								30,
								'jetpack-forms'
							) }
						</Tip>
					</div>
				) }
			</div>

			{ previewFile && (
				<Modal title={ decodeEntities( previewFile.name ) } onRequestClose={ closePreviewModal }>
					<PreviewFile
						file={ previewFile }
						isLoading={ isImageLoading }
						onImageLoaded={ handleImageLoaded }
					/>
				</Modal>
			) }
		</>
	);
}

/**
 * Renders the inspector for responses.
 *
 * @return - Element containing the inspector for responses.
 */
function Inspector() {
	const params = useParams( { from: '/responses/$view' } );
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	const responseIds = searchParams?.responseIds || [];

	// Determine the status based on the current view
	let status = 'publish';
	if ( params.view === 'spam' ) {
		status = 'spam';
	} else if ( params.view === 'trash' ) {
		status = 'trash';
	}

	// Fetch all visible records using the same query as the stage
	// This leverages core-data's cache, so records loaded by stage are reused
	const { records } = useEntityRecords< FormResponse >( 'postType', 'feedback', {
		status,
		per_page: 20,
		page: 1,
		orderby: 'date',
		order: 'desc',
	} );

	// Get all record IDs for navigation
	const allRecordIds = records?.map( record => record.id ) ?? [];

	const handleClose = useCallback( () => {
		navigate( {
			search: {
				...searchParams,
				responseIds: undefined,
			},
		} );
	}, [ navigate, searchParams ] );

	const handleNavigate = useCallback(
		( id: number ) => {
			navigate( {
				search: {
					...searchParams,
					responseIds: [ String( id ) ],
				},
			} );
		},
		[ navigate, searchParams ]
	);

	if ( responseIds.length !== 1 ) {
		return null;
	}

	const selectedResponseId = Number( responseIds[ 0 ] );

	return (
		<Page showSidebarToggle={ false } hasPadding={ false }>
			<SingleResponseView
				responseId={ selectedResponseId }
				allResponseIds={ allRecordIds }
				onNavigate={ handleNavigate }
				onClose={ handleClose }
			/>
		</Page>
	);
}

export { Inspector as inspector };

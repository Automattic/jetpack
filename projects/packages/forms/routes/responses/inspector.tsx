/* eslint-disable react-hooks/rules-of-hooks */
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
/**
 * Internal dependencies
 */
import CopyClipboardButton from '../../src/dashboard/components/copy-clipboard-button';
import Flag from '../../src/dashboard/components/flag';
import Gravatar from '../../src/dashboard/components/gravatar';

const getDisplayName = ( response: any ) => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip || 'Anonymous' );
};

const isFileUploadField = ( value: any ) => {
	return value && typeof value === 'object' && 'files' in value;
};

const isImageSelectField = ( value: any ) => {
	return value?.type === 'image-select';
};

const isLikelyPhoneNumber = ( value: any ) => {
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
 *
 * @param root0
 * @param root0.file
 * @param root0.file.url
 * @param root0.file.name
 * @param root0.isLoading
 * @param root0.onImageLoaded
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

/**
 *
 * @param root0
 * @param root0.files
 * @param root0.handleFilePreview
 */
function FieldFile( {
	files,
	handleFilePreview,
}: {
	files: Array< { url: string; name: string; is_image?: boolean } >;
	handleFilePreview: ( file: any ) => () => void;
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
 *
 * @param root0
 * @param root0.email
 */
function FieldEmail( { email }: { email: string } ) {
	return (
		<span style={ { display: 'inline-flex', alignItems: 'center', gap: '4px' } }>
			<a href={ `mailto:${ email }` }>{ email }</a>
			<CopyClipboardButton text={ email } />
		</span>
	);
}

/**
 *
 * @param root0
 * @param root0.choices
 * @param root0.handleFilePreview
 */
function FieldImageSelect( {
	choices,
	handleFilePreview,
}: {
	choices: Array< { url: string; name: string; selected?: boolean } >;
	handleFilePreview: ( file: any ) => () => void;
} ) {
	return (
		<div style={ { display: 'flex', gap: '8px', flexWrap: 'wrap' } }>
			{ choices.map( ( choice, index ) => (
				<div
					key={ index }
					style={ {
						border: choice.selected ? '2px solid var(--wp-admin-theme-color)' : '1px solid #ddd',
						borderRadius: '4px',
						padding: '4px',
						cursor: 'pointer',
					} }
					onClick={ handleFilePreview( choice ) }
					onKeyDown={ e => e.key === 'Enter' && handleFilePreview( choice )() }
					role="button"
					tabIndex={ 0 }
				>
					<img
						src={ choice.url }
						alt={ choice.name }
						style={ { width: '60px', height: '60px', objectFit: 'cover' } }
					/>
				</div>
			) ) }
		</div>
	);
}

/**
 *
 * @param root0
 * @param root0.response
 * @param root0.onActionComplete
 */
function ResponseActions( {
	response,
	onActionComplete,
}: {
	response: any;
	onActionComplete: ( item: any ) => void;
} ) {
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const [ isLoading, setIsLoading ] = useState( false );

	const handleMarkAsSpam = useCallback( async () => {
		setIsLoading( true );
		try {
			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'spam',
			} );
			onActionComplete( { ...response, status: 'spam' } );
		} finally {
			setIsLoading( false );
		}
	}, [ response, saveEntityRecord, onActionComplete ] );

	const handleMarkAsNotSpam = useCallback( async () => {
		setIsLoading( true );
		try {
			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'publish',
			} );
			onActionComplete( { ...response, status: 'publish' } );
		} finally {
			setIsLoading( false );
		}
	}, [ response, saveEntityRecord, onActionComplete ] );

	const handleMoveToTrash = useCallback( async () => {
		setIsLoading( true );
		try {
			await deleteEntityRecord( 'postType', 'feedback', response.id );
			onActionComplete( { ...response, status: 'trash' } );
		} finally {
			setIsLoading( false );
		}
	}, [ response, deleteEntityRecord, onActionComplete ] );

	const handleRestore = useCallback( async () => {
		setIsLoading( true );
		try {
			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'publish',
			} );
			onActionComplete( { ...response, status: 'publish' } );
		} finally {
			setIsLoading( false );
		}
	}, [ response, saveEntityRecord, onActionComplete ] );

	const handleDelete = useCallback( async () => {
		setIsLoading( true );
		try {
			await deleteEntityRecord( 'postType', 'feedback', response.id, { force: true } );
			onActionComplete( null );
		} finally {
			setIsLoading( false );
		}
	}, [ response, deleteEntityRecord, onActionComplete ] );

	const handleToggleRead = useCallback( async () => {
		setIsLoading( true );
		try {
			await apiFetch( {
				path: `/wp/v2/feedback/${ response.id }/read`,
				method: 'POST',
				data: { is_unread: ! response.is_unread },
			} );
			onActionComplete( { ...response, is_unread: ! response.is_unread } );
		} finally {
			setIsLoading( false );
		}
	}, [ response, onActionComplete ] );

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
 *
 * @param root0
 * @param root0.hasNext
 * @param root0.hasPrevious
 * @param root0.onNext
 * @param root0.onPrevious
 * @param root0.onClose
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
 *
 * @param root0
 * @param root0.responseId
 * @param root0.allResponseIds
 * @param root0.onNavigate
 * @param root0.onClose
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
	const [ previewFile, setPreviewFile ] = useState< any >( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );
	const [ hasMarkedAsRead, setHasMarkedAsRead ] = useState< number | null >( null );

	const { editEntityRecord } = useDispatch( coreStore );

	const { response, isLoading } = useSelect(
		select => {
			if ( ! responseId ) {
				return { response: null, isLoading: false };
			}
			return {
				response: select( coreStore ).getEntityRecord( 'postType', 'feedback', responseId ),
				isLoading: select( coreStore ).isResolving( 'getEntityRecord', [
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
		( file: any ) => () => {
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
		( updatedItem: any ) => {
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

	const renderFieldValue = ( value: any ) => {
		if ( value === null || value === undefined ) {
			return '-';
		}

		if ( isImageSelectField( value ) ) {
			return <FieldImageSelect choices={ value.choices } handleFilePreview={ handleFilePreview } />;
		}

		if ( isFileUploadField( value ) ) {
			return <FieldFile files={ value.files } handleFilePreview={ handleFilePreview } />;
		}

		const emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		if ( typeof value === 'string' && emailRegEx.test( value ) ) {
			return <FieldEmail email={ value } />;
		}

		if ( isLikelyPhoneNumber( value ) ) {
			return <a href={ `tel:${ value }` }>{ value }</a>;
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
									{
										/* Translators: %1$s is the date, %2$s is the time. */
										sprintf(
											__( '%1$s at %2$s', 'jetpack-forms' ),
											dateI18n( dateSettings.formats.date, response.date ),
											dateI18n( dateSettings.formats.time, response.date )
										)
									}
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
 *
 */
export function inspector() {
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
	const { records } = useEntityRecords( 'postType', 'feedback', {
		status,
		per_page: 20,
		page: 1,
		orderby: 'date',
		order: 'desc',
	} );

	// Get all record IDs for navigation
	const allRecordIds = ( records || [] ).map( record => record.id );

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

	if ( ! responseIds.length ) {
		return null;
	}

	const isBulkSelection = responseIds.length > 1;
	const selectedResponseId = Number( responseIds[ 0 ] );

	return (
		<Page showSidebarToggle={ false } hasPadding={ false }>
			{ isBulkSelection ? (
				<div style={ { padding: '20px' } }>
					<p>
						{
							/* Translators: %d is the number of selected responses. */
							sprintf(
								__(
									'%d responses selected. Select a single response to view details.',
									'jetpack-forms'
								),
								responseIds.length
							)
						}
					</p>
					<Button onClick={ handleClose }>{ __( 'Clear selection', 'jetpack-forms' ) }</Button>
				</div>
			) : (
				<SingleResponseView
					responseId={ selectedResponseId }
					allResponseIds={ allRecordIds }
					onNavigate={ handleNavigate }
					onClose={ handleClose }
				/>
			) }
		</Page>
	);
}

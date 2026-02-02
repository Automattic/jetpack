/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, ExternalLink, Modal, Spinner, Tip } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n } from '@wordpress/i18n';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
import * as React from 'react';
/**
 * Internal dependencies
 */
import CopyClipboardButton from '../../../src/dashboard/components/copy-clipboard-button';
import PreviewFile from '../../../src/dashboard/components/inspector/preview-file';
import ResponseMeta from '../../../src/dashboard/components/inspector/response-meta';
import {
	isFileUploadField,
	isImageSelectField,
	isLikelyPhoneNumber,
} from '../../../src/dashboard/components/inspector/utils';
import useInboxData from '../../../src/dashboard/hooks/use-inbox-data.ts';
import { ResponseActions } from './actions';
import { ResponseNavigation } from './navigation';
import type { DispatchActions, SelectActions } from '../../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../../src/types/index.ts';
import '../../../src/dashboard/components/inspector/style.scss';

type DisplayField = {
	label: string;
	value: unknown;
	key: string;
};

const getDisplayFields = (
	fields: FormResponse[ 'fields' ] | undefined | null
): DisplayField[] => {
	if ( ! fields ) {
		return [];
	}

	// New collection format: [{ label, value, key, ... }]
	if ( Array.isArray( fields ) ) {
		return fields.map( ( field, index ) => ( {
			label: field.label || field.key || String( index ),
			value: field.value,
			key: field.key || field.id || `${ index }-${ field.label }`,
		} ) );
	}

	// Legacy format: { [label]: value }
	return Object.entries( fields ).map( ( [ label, value ] ) => ( {
		label,
		value,
		key: label,
	} ) );
};

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

	const { editEntityRecord } = useDispatch( coreStore ) as unknown as DispatchActions;

	const { response, isLoading } = useSelect(
		select => {
			if ( ! responseId ) {
				return { response: null, isLoading: false };
			}

			return {
				response: ( select( coreStore ) as unknown as SelectActions ).getEntityRecord(
					'postType',
					'feedback',
					responseId
				) as unknown as FormResponse | null,
				isLoading: ( select( coreStore ) as unknown as SelectActions ).isResolving(
					'getEntityRecord',
					[ 'postType', 'feedback', responseId ]
				),
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

	const displayFields = useMemo( () => getDisplayFields( response?.fields ), [ response?.fields ] );

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
				<ResponseMeta response={ response } />

				{ displayFields.length > 0 && (
					<div>
						{ displayFields.map( ( { label, value, key } ) => (
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
									{ label.endsWith( '?' ) ? label : `${ label }:` }
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
 * Renders the response contents for inspector panel.
 *
 * @return - Element containing response contents.
 */
export default function Response() {
	const params = useParams( { from: '/responses/$view' } );
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	const responseIds = searchParams?.responseIds || [];
	const statusView = params.view === 'spam' || params.view === 'trash' ? params.view : 'inbox';

	const { records } = useInboxData( { status: statusView } );
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
		<SingleResponseView
			responseId={ selectedResponseId }
			allResponseIds={ allRecordIds }
			onNavigate={ handleNavigate }
			onClose={ handleClose }
		/>
	);
}

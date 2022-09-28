import { InnerBlocks, InspectorControls, BlockIcon } from '@wordpress/block-editor';
import {
	Panel,
	PanelBody,
	withNotices,
	Placeholder,
	FormFileUpload,
	Button,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import createBlocksFromInnerBlocksTemplate from '../../shared/create-block-from-inner-blocks-template';
import { TranscriptIcon as icon } from '../../shared/icons';
import TranscriptionContext from './components/context';
import { ParticipantsSelector } from './components/participants-controls';
import {
	getParticipantByLabel,
	parseTranscriptFile,
	pickExtensionFromFileName,
	isAcceptedTranscriptExtension,
	ACCEPTED_FILE_EXTENSIONS,
	TRANSCRIPT_MAX_FILE_SIZE,
} from './utils';

const TRANSCRIPTION_TEMPLATE = [ [ 'jetpack/dialogue' ] ];

function ConversationEdit( {
	className,
	attributes,
	setAttributes,
	noticeUI,
	clientId,
	noticeOperations,
} ) {
	const { participants = [], showTimestamps, skipUpload } = attributes;
	const [ isProcessingFile, setIsProcessingFile ] = useState( '' );
	const { insertBlocks } = useDispatch( 'core/block-editor' );

	const updateParticipants = useCallback(
		updatedParticipant => {
			setAttributes( {
				participants: participants.map( participant => {
					if ( participant.slug !== updatedParticipant.slug ) {
						return participant;
					}

					return {
						...participant,
						...updatedParticipant,
					};
				} ),
			} );
		},
		[ setAttributes, participants ]
	);

	const addNewParticipant = useCallback(
		function ( { label, slug } ) {
			if ( ! label ) {
				return;
			}

			const sanitizedSpeakerLabel = label.trim();
			// Do not add speakers with empty names.
			if ( ! sanitizedSpeakerLabel?.length ) {
				return;
			}

			// Do not add a new participant with the same label.
			const existingParticipant = getParticipantByLabel( participants, sanitizedSpeakerLabel );
			if ( existingParticipant ) {
				return existingParticipant;
			}

			// Creates the participant slug.
			const newParticipantSlug = slug || `speaker-${ +new Date() }`;

			const newParticipant = {
				slug: newParticipantSlug,
				label: sanitizedSpeakerLabel,
			};

			setAttributes( {
				participants: [ ...participants, newParticipant ],
			} );

			return newParticipant;
		},
		[ participants, setAttributes ]
	);

	const setBlockAttributes = useCallback( setAttributes, [ setAttributes ] );

	// Context bridge.
	const contextProvision = useMemo(
		() => ( {
			setAttributes: setBlockAttributes,
			updateParticipants,
			addNewParticipant,
			attributes: {
				showTimestamps,
			},
		} ),
		[ addNewParticipant, setBlockAttributes, showTimestamps, updateParticipants ]
	);

	function deleteParticipant( deletedParticipantSlug ) {
		setAttributes( {
			participants: participants.filter( ( { slug } ) => slug !== deletedParticipantSlug ),
		} );
	}

	function showTranscriptProcessErrorMessage( message ) {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
		setIsProcessingFile( false );
	}

	function uploadTranscriptFile( event ) {
		const transcriptFile = event.target.files?.[ 0 ];

		// Check file exists.
		if ( ! transcriptFile ) {
			return showTranscriptProcessErrorMessage( __( 'Transcript file not found.', 'jetpack' ) );
		}

		// Check file MAX size.
		if (
			( transcriptFile?.size && transcriptFile.size <= 0 ) || // min size
			! transcriptFile?.size ||
			transcriptFile.size > TRANSCRIPT_MAX_FILE_SIZE // max size
		) {
			return showTranscriptProcessErrorMessage( __( 'Invalid transcript file size.', 'jetpack' ) );
		}

		// Check file type.
		if ( transcriptFile?.type?.length && transcriptFile.type !== 'text/plain' ) {
			return showTranscriptProcessErrorMessage( __( 'Invalid transcript file type.', 'jetpack' ) );
		}

		// Check format by extension.
		const fileExtension = pickExtensionFromFileName( transcriptFile?.name );
		if ( ! isAcceptedTranscriptExtension( fileExtension ) ) {
			return showTranscriptProcessErrorMessage(
				__( 'Invalid transcript file extension.', 'jetpack' )
			);
		}

		setIsProcessingFile( true );

		parseTranscriptFile( transcriptFile, function ( { conversation, dialogues }, err ) {
			if ( err ) {
				return showTranscriptProcessErrorMessage( err );
			}

			setAttributes( {
				participants: conversation.speakers,
				skipUpload: ! conversation?.length,
			} );

			const dialogueBlocksTemplate = dialogues.map( dialogue =>
				dialogue.slug || dialogue.timestamp
					? [ 'jetpack/dialogue', dialogue ]
					: [ 'core/paragraph', dialogue ]
			);

			const dialogueBlocks = createBlocksFromInnerBlocksTemplate( dialogueBlocksTemplate );
			insertBlocks( dialogueBlocks, 0, clientId );
			setIsProcessingFile( false );
		} );
	}

	const baseClassName = 'wp-block-jetpack-conversation';

	if ( ! participants?.length && ! skipUpload ) {
		return (
			<Placeholder
				label={ __( 'Conversation', 'jetpack' ) }
				instructions={
					<>
						{ __(
							'Upload a transcript file or create a conversation with blank content.',
							'jetpack'
						) }
						<div>
							<em>
								{ __( 'Accepted file formats:', 'jetpack' ) }
								<strong> { ACCEPTED_FILE_EXTENSIONS }</strong>.
							</em>
						</div>
					</>
				}
				icon={ <BlockIcon icon={ icon } /> }
				notices={ noticeUI }
			>
				<div className={ `${ baseClassName }__placeholder` }>
					<FormFileUpload
						multiple={ false }
						className="wp-block-jetpack-slideshow__add-item-button"
						onChange={ uploadTranscriptFile }
						accept={ ACCEPTED_FILE_EXTENSIONS }
						variant="primary"
						title={ `${ __( 'Accepted file formats:', 'jetpack' ) } ${ ACCEPTED_FILE_EXTENSIONS }` }
						disabled={ isProcessingFile }
					>
						{ __( 'Upload transcript', 'jetpack' ) }
					</FormFileUpload>

					<Button
						variant="tertiary"
						disabled={ isProcessingFile }
						onClick={ () => setAttributes( { skipUpload: true } ) }
					>
						{ __( 'Skip upload', 'jetpack' ) }
					</Button>
				</div>
			</Placeholder>
		);
	}

	return (
		<TranscriptionContext.Provider value={ contextProvision }>
			<div className={ className }>
				<InspectorControls>
					<Panel>
						<PanelBody
							title={ __( 'Speakers', 'jetpack' ) }
							className={ `${ baseClassName }__participants` }
						>
							<ParticipantsSelector
								className={ baseClassName }
								participants={ participants }
								onDelete={ deleteParticipant }
							/>
						</PanelBody>
					</Panel>
				</InspectorControls>

				<InnerBlocks template={ TRANSCRIPTION_TEMPLATE } />
			</div>
		</TranscriptionContext.Provider>
	);
}

export default withNotices( ConversationEdit );

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { InnerBlocks, InspectorControls, BlockIcon } from '@wordpress/block-editor';
import { Panel, PanelBody, withNotices, Placeholder, FormFileUpload, Button } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './editor.scss';
import { ParticipantsSelector } from './components/participants-controls';
import TranscriptionContext from './components/context';
import { getParticipantByLabel } from './utils';
import { TranscriptIcon as icon } from '../../shared/icons';
import { pickExtensionFromFileName } from '../../shared/file-utils';
import { SRT_parse, TXT_parse } from '../../shared/transcript-utils';
import { convertSecondsToTimeCode, convertTimeCodeToSeconds } from '../../shared/components/media-player-control/utils';

const TRANSCRIPTION_TEMPLATE = [ [ 'jetpack/dialogue' ] ];

const FILE_EXTENSION_SRT = '.srt';
const FILE_EXTENSION_TXT = '.txt';
const FILE_EXTENSION_VTT = '.vtt';
const FILE_EXTENSION_SBV = '.sbv';

const ACCEPTED_FILE_EXT_ARRAY = [
	FILE_EXTENSION_SRT,
	FILE_EXTENSION_TXT,
	FILE_EXTENSION_VTT,
	FILE_EXTENSION_SBV,
];

const ACCEPTED_FILE_EXTENSIONS = ACCEPTED_FILE_EXT_ARRAY.join( ', ' );

function ConversationEdit( {
	className,
	attributes,
	setAttributes,
	noticeUI,
	clientId,
} ) {
	const { participants = [], showTimestamps, createdFromScratch } = attributes;
	const { insertBlocks } = useDispatch( 'core/block-editor' );
	const [ isProcessingFile, setIsProcessingFile ] = useState( '' );

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

	const setBlockAttributes = useCallback( setAttributes, [] );

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

	function uploadFromFiles( event ) {
		if ( event ) {
			event.preventDefault();
		}

		const textFile = event.target.files?.[ 0 ];
		if ( ! textFile ) {
			return;
		}
		setIsProcessingFile( true );

		// Read file content.
		const reader = new FileReader();
		reader.addEventListener( 'load', ( ev ) => {
			const rawData = ev.target.result;
			if ( ! rawData?.length ) {
				return;
			}

			// Detect format by extension.
			const fileExtension = pickExtensionFromFileName( textFile?.name );

			if (
				fileExtension &&
				fileExtension !== FILE_EXTENSION_TXT &&
				ACCEPTED_FILE_EXT_ARRAY.indexOf( fileExtension ) >= 0
			) {
				if ( fileExtension === FILE_EXTENSION_SRT ) {
					// SRT doesn't include speakers.
					const newSpeaker = addNewParticipant( {
						label: 'Speaker',
					} );

					const parsedSRTData = SRT_parse( rawData );
					const blocks = parsedSRTData.map( function( dialogue ) {
						return createBlock( 'jetpack/dialogue', {
							slug: newSpeaker.slug,
							content: dialogue.text,
							timestamp: convertSecondsToTimeCode( convertTimeCodeToSeconds( dialogue.startTime ) ),
							showTimestamp: true,
						} );
					} );

					insertBlocks( blocks, 0, clientId );
				}
			}

			if ( fileExtension === FILE_EXTENSION_TXT ) {
				const parsedUnknownFormatContent = TXT_parse( rawData );
				setAttributes( {
					participants: [ ...participants, ...parsedUnknownFormatContent.speakers ],
				} );

				const blocks = parsedUnknownFormatContent.dialogues.map( function( dialogue ) {
					return createBlock( 'jetpack/dialogue', {
						slug: dialogue.speakerSlug,
						label: dialogue.speaker,
						content: dialogue.content,
						timestamp: dialogue.timestamp,
						showTimestamp: true,
					} );
				} );

				insertBlocks( blocks, 0, clientId );
				setIsProcessingFile( false );
			}
		} );

		reader.readAsText( textFile );
	}

	const baseClassName = 'wp-block-jetpack-conversation';

	if ( ! participants?.length && ! createdFromScratch ) {
		return (
			<Placeholder
				label={ __( 'Conversation', 'jetpack' ) }
				instructions={ __(
					'Upload a transcript file or create a conversation from scratch.',
					'jetpack'
				) }
				icon={ <BlockIcon icon={ icon } /> }
				notices={ noticeUI }
			>
				<div className={ `${ baseClassName }__placeholder` }>
					<FormFileUpload
						multiple={ false }
						isLarge
						className="wp-block-jetpack-slideshow__add-item-button"
						onChange={ uploadFromFiles }
						accept={ ACCEPTED_FILE_EXTENSIONS }
						isPrimary
						title={ `${ __( 'Accepted file formats:', 'jetpack' ) } ${ ACCEPTED_FILE_EXTENSIONS }` }
						disabled={ isProcessingFile }
					>
						{ __( 'Upload transcript', 'jetpack' ) }
					</FormFileUpload>

					<Button
						isTertiary
						disabled={ isProcessingFile }
						onClick={ () => setAttributes( { createdFromScratch: true } ) }
					>
						{ __( 'From scratch', 'jetpack' ) }
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

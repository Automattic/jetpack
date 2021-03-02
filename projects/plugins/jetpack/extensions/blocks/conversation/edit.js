/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';

import { InnerBlocks, InspectorControls, BlockIcon } from '@wordpress/block-editor';
import { Panel, PanelBody, withNotices, Placeholder, FormFileUpload, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import { ParticipantsSelector } from './components/participants-controls';
import TranscriptionContext from './components/context';
import { getParticipantByLabel, ACCEPTED_FILE_EXTENSIONS } from './utils';
import { TranscriptIcon as icon } from '../../shared/icons';

const TRANSCRIPTION_TEMPLATE = [ [ 'jetpack/dialogue' ] ];

function ConversationEdit( {
	className,
	attributes,
	setAttributes,
	noticeUI,
 } ) {
	const { participants = [], showTimestamps, createdFromScratch } = attributes;
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

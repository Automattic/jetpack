/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';

import { InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { Panel, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import { ParticipantsSelector } from './components/participants-controls';
import TranscriptionContext from './components/context';
import { getParticipantByLabel, cleanFormatStyle } from './utils';

const TRANSCRIPTION_TEMPLATE = [ [ 'jetpack/dialogue' ] ];

function ConversationEdit( { className, attributes, setAttributes } ) {
	const { participants = [], showTimestamps } = attributes;

	const updateParticipants = useCallback(
		updatedParticipant => {
			setAttributes( {
				participants: participants.map( participant => {
					if ( participant.slug !== updatedParticipant.slug ) {
						return participant;
					}

					updatedParticipant.label = cleanFormatStyle( updatedParticipant.label );

					return {
						...participant,
						...updatedParticipant,
					};
				} ),
			} );
		},
		[ setAttributes, participants ]
	);

	const addNewParticipant = useCallback( function( newSpeakerLabel ) {
		if ( ! newSpeakerLabel ) {
			return;
		}

		const sanitizedSpeakerLabel = cleanFormatStyle( newSpeakerLabel );
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
		const newParticipantSlug = participants.length
			? participants[ participants.length - 1 ].slug.replace( /(\d+)/, n => Number( n ) + 1 )
			: 'speaker-0';

		const newParticipant = {
			slug: newParticipantSlug,
			label: sanitizedSpeakerLabel,
		};

		setAttributes( {
			participants: [
				...participants,
				newParticipant,
			],
		} );

		return newParticipant;
	}, [ participants, setAttributes ] );

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
		[
			addNewParticipant,
			setBlockAttributes,
			showTimestamps,
			updateParticipants,
		]
	);

	function deleteParticipant( deletedParticipantSlug ) {
		setAttributes( {
			participants: participants.filter( ( { slug } ) => slug !== deletedParticipantSlug ),
		} );
	}

	const baseClassName = 'wp-block-jetpack-conversation';

	return (
		<TranscriptionContext.Provider value={ contextProvision }>
			<div className={ className }>
				<InspectorControls>
					<Panel>
						<PanelBody
							title={ __( 'Participants', 'jetpack' ) }
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

export default ConversationEdit;

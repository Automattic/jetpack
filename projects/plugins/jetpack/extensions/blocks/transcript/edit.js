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
import { getParticipantByLabel } from './utils';

const TRANSCRIPTION_TEMPLATE = [ [ 'jetpack/dialogue' ] ];

function TranscriptEdit( { className, attributes, setAttributes } ) {
	const { participants = [], showTimestamps } = attributes;

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
		function ( newParticipantLabel ) {
			if ( ! newParticipantLabel ) {
				return;
			}

			newParticipantLabel = newParticipantLabel.trim();
			// Do not add participants with empty names.
			if ( ! newParticipantLabel?.length ) {
				return;
			}

			// Do not add a new participant with the same label.
			const existingParticipant = getParticipantByLabel( participants, newParticipantLabel );
			if ( existingParticipant ) {
				return existingParticipant;
			}

			// Creates the participant slug.
			const newParticipantSlug = participants.length
				? participants[ participants.length - 1 ].slug.replace( /(\d+)/, n => Number( n ) + 1 )
				: 'participant-0';

			const newParticipant = {
				slug: newParticipantSlug,
				label: newParticipantLabel,
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

	const baseClassName = 'wp-block-jetpack-transcript';

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

export default TranscriptEdit;

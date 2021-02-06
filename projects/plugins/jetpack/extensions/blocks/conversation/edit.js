/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { InnerBlocks, InspectorControls, BlockControls } from '@wordpress/block-editor';
import {
	Panel,
	PanelBody,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import ParticipantsDropdown, { ParticipantsSelector } from './components/participants-controls';
import TranscriptionContext from './components/context';
import { getParticipantByLabel } from './utils';

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

		const sanitizedSpeakerLabel = newSpeakerLabel.trim();
		// Do not add speakers with empty names.
		if ( ! sanitizedSpeakerLabel?.length ) {
			return;
		}

		// Do not add a new participant with the same label.
		const existingParticipant = getParticipantByLabel( participants, sanitizedSpeakerLabel );
		if ( existingParticipant ) {
			return existingParticipant;
		}

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
				<BlockControls>
					<ToolbarGroup>
						<ParticipantsDropdown
							className={ baseClassName }
							participants={ participants }
							label={ __( 'Participants', 'jetpack' ) }
							onChange={ updateParticipants }
							onDelete={ deleteParticipant }
							onAdd={ addNewParticipant }
						/>
					</ToolbarGroup>

					<ToolbarGroup>
						<ToolbarButton
							isActive={ showTimestamps }
							onClick={ () => setAttributes( { showTimestamps: ! showTimestamps } ) }
						>
							{ __( 'Timestamps', 'jetpack' ) }
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<Panel>
						<PanelBody
							title={ __( 'Participants', 'jetpack' ) }
							className={ `${ baseClassName }__participants` }
						>
							<ParticipantsSelector
								className={ baseClassName }
								participants={ participants }
								onChange={ updateParticipants }
								onDelete={ deleteParticipant }
								onAdd={ addNewParticipant }
							/>
						</PanelBody>

						<PanelBody
							title={ __( 'Timestamps', 'jetpack' ) }
							className={ `${ baseClassName }__timestamps` }
						>
							<ToggleControl
								label={ __( 'Show timestamps', 'jetpack' ) }
								checked={ showTimestamps }
								onChange={ value => setAttributes( { showTimestamps: value } ) }
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

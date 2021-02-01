/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback, useMemo } from '@wordpress/element';
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

import { list as defaultParticipants } from './participants.json';

const TRANSCRIPTION_TEMPLATE = [
	[ 'core/heading', { placeholder: __( 'Conversation title', 'jetpack' ) } ],
	[ 'jetpack/dialogue', {
		participantLabel: defaultParticipants[ 0 ].label,
		participantSlug: defaultParticipants[ 0 ].slug,
	} ],
	[ 'jetpack/dialogue', {
		participantLabel: defaultParticipants[ 1 ].label,
		participantSlug: defaultParticipants[ 1 ].slug,
	} ],
	[ 'jetpack/dialogue', {
		participantLabel: defaultParticipants[ 2 ].label,
		participantSlug: defaultParticipants[ 2 ].slug,
	} ],
];

function ConversationEdit( { className, attributes, setAttributes } ) {
	const { participants = [], showTimestamps } = attributes;

	// Set initial conversation participants.
	useEffect( () => {
		if ( participants?.length ) {
			return;
		}

		setAttributes( { participants: defaultParticipants } );
	}, [ participants, setAttributes ] );

	const updateParticipants = useCallback(
		updatedParticipant =>
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
			} ),
		[ setAttributes, participants ]
	);

	const setBlockAttributes = useCallback( setAttributes, [] );

	// Context bridge.
	const contextProvision = useMemo(
		() => ( {
			setAttributes: setBlockAttributes,
			updateParticipants,
			getParticipantIndex: slug => participants.map( part => part.slug ).indexOf( slug ),
			getNextParticipantIndex: ( slug, offset = 0 ) =>
				( contextProvision.getParticipantIndex( slug ) + 1 + offset ) % participants.length,
			getNextParticipant: ( slug, offset = 0 ) =>
				participants[ contextProvision.getNextParticipantIndex( slug, offset ) ],

			attributes: {
				showTimestamps,
			},
		} ),
		[ participants, setBlockAttributes, showTimestamps, updateParticipants ]
	);

	function deleteParticipant( deletedParticipantSlug ) {
		setAttributes( {
			participants: participants.filter( ( { slug } ) => slug !== deletedParticipantSlug ),
		} );
	}

	function addNewParticipant( newSpakerValue ) {
		const newParticipantSlug = participants.length
			? participants[ participants.length - 1 ].slug.replace( /(\d+)/, n => Number( n ) + 1 )
			: 'speaker-0';
		setAttributes( {
			participants: [
				...participants,
				{
					label: newSpakerValue,
					slug: newParticipantSlug,
					hasBoldStyle: true,
				},
			],
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

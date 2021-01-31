/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback, useMemo } from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import { Panel, PanelBody, ToggleControl, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { create, getTextContent } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import './editor.scss';
import ParticipantsDropdown, { ParticipantsSelector } from './components/participants-controls';
import TranscriptionContext from './components/context';

import { list as defaultParticipants } from './participants.json';

const TRANSCRIPTION_TEMPLATE = [
	[ 'core/heading', { placeholder: __( 'Conversation title', 'jetpack' ) } ],
	[ 'jetpack/dialogue', defaultParticipants[ 0 ] ],
	[ 'jetpack/dialogue', defaultParticipants[ 1 ] ],
	[ 'jetpack/dialogue', defaultParticipants[ 2 ] ],
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
					if ( participant.participantSlug !== updatedParticipant.participantSlug ) {
						return participant;
					}

					return {
						...participant,
						...updatedParticipant,
						participantPlain: getTextContent( create( { html: participant.participant } ) ),
					};
				} ),
			} ),
		[ setAttributes, participants ]
	);

	const deleteParticipant = useCallback( function ( deletedParticipantSlug ) {
		setAttributes( {
			participants: participants.filter(
				( { participantSlug } ) => participantSlug !== deletedParticipantSlug
			),
		} );
	}, [ participants, setAttributes ] );

	const getParticipantByValue = useCallback( function ( participantValue ) {
		const part = participants.filter( ( { participant } ) => ( participant.toLowerCase() === participantValue.toLowerCase() ) );
		return part?.length ? part[ 0 ] : null;
	}, [ participants ] );

	const addNewParticipant = useCallback( function( newSpakerValue ) {
		const newParticipantSlug = participants.length
			? participants[ participants.length - 1 ].participantSlug.replace(
					/(\d+)/,
					n => Number( n ) + 1
			  )
			: 'speaker-0';

		const participantPlain = getTextContent( create( { html: newSpakerValue } ) );

		// We don't want to duplicate participants.
		const participantExist = getParticipantByValue( participantPlain );
		if ( participantExist ) {
			return;
		}

		const newParticipant = {
			participant: newSpakerValue,
			participantSlug: newParticipantSlug,
			participantPlain,
			hasBoldStyle: true,
		};

		setAttributes( {
			participants: [
				...participants,
				newParticipant,
			],
		} );

		return newParticipant;
	}, [getParticipantByValue, participants, setAttributes] );

	const setBlockAttributes = useCallback( setAttributes, [] );

	// Context bridge.
	const contextProvision = useMemo( () => ( {
		setAttributes: setBlockAttributes,
		addNewParticipant,
		updateParticipants,
		deleteParticipant,
		getParticipantIndex: slug => participants.map( part => part.participantSlug ).indexOf( slug ),
		getNextParticipantIndex: ( slug, offset = 0 ) =>
			( contextProvision.getParticipantIndex( slug ) + 1 + offset ) % participants.length,
		getNextParticipantSlug: ( slug, offset = 0 ) =>
			participants[ contextProvision.getNextParticipantIndex( slug, offset ) ]?.participantSlug,
		getPrevParticipantSlug: ( slug, offset = -2 ) =>
			participants[ contextProvision.getNextParticipantIndex( slug, offset ) ]?.participantSlug,

		getParticipantByValue,

		attributes: {
			showTimestamps,
		},
	} ), [
		deleteParticipant,
		participants,
		setBlockAttributes,
		showTimestamps,
		updateParticipants,
		addNewParticipant,
		getParticipantByValue,
	] );

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

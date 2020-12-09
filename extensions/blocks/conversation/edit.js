/**
 * External dependencies
 */
import { filter, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import {
	Panel,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import ParticipantsDropdown, { ParticipantsSelector } from './components/participants-controls';
import TranscritptionContext from './components/context';

import { list as defaultParticipants } from './participants.json';
console.log( 'defaultParticipants: ', defaultParticipants );

const TRANSCRIPTION_TEMPLATE = [
	[ 'core/heading', { placeholder: __( 'Conversation title', 'jetpack' ) } ],
	[ 'jetpack/dialogue', defaultParticipants[ 0 ] ],
	[ 'jetpack/dialogue', defaultParticipants[ 1 ] ],
	[ 'jetpack/dialogue', defaultParticipants[ 2 ] ],
];

function ConversationEdit ( {
	className,
	attributes,
	setAttributes,
} ) {
	const { participants, showTimeStamp, className: classNameAttr } = attributes;
	const containertRef = useRef();

	// Set initial conversation participants.
	useEffect( () => {
		if ( participants ) {
			return;
		}

		setAttributes( { participants: defaultParticipants } );
	}, [ participants, setAttributes ] );

	const updateParticipants = useCallback( ( updatedParticipant ) => (
		setAttributes( { participants: map( participants, ( participant ) => {
			if ( participant.participantSlug !== updatedParticipant.participantSlug ) {
				return participant;
			}
			return {
				...participant,
				...updatedParticipant,
			};
		} ) } )
	), [ setAttributes, participants ] );

	// Context bridge.
	const contextProvision = {
		setAttributes: useMemo( () => setAttributes, [ setAttributes ] ),
		updateParticipants,

		attributes: {
			showTimeStamp,
			classNameAttr,
		},
	};

	function deleteParticipant( deletedParticipantSlug ) {
		setAttributes( { participants: filter( participants, ( { participantSlug } ) => ( participantSlug !== deletedParticipantSlug ) ) } );
	}

	function addNewParticipant( newSpakerValue ) {
		const newParticipantSlug = participants.length
			? ( participants[ participants.length - 1 ].participantSlug ).replace( /(\d+)/, ( n ) => Number( n ) + 1 )
			: 'sepaker-0';
		setAttributes( {
			participants: [
				...participants,
				{
					participant: newSpakerValue,
					participantSlug: newParticipantSlug,
				},
			],
		} );
	}

	const baseClassName = 'wp-block-jetpack-conversation';

	return (
		<TranscritptionContext.Provider value={ contextProvision }>
			<div ref={ containertRef } className={ className }>
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
				</BlockControls>

				<InspectorControls>
					<Panel>
						<PanelBody title={ __( 'Participants', 'jetpack' ) } className={ `${ baseClassName }__participants` }>
							<ParticipantsSelector
								className={ baseClassName }
								participants={ participants }
								onChange={ updateParticipants }
								onDelete={ deleteParticipant }
								onAdd={ addNewParticipant }
							/>
						</PanelBody>

						<PanelBody title={ __( 'Time stamps', 'context' ) } className={ `${ baseClassName }__timestamps` }>
							<ToggleControl
								label={ __( 'Show time 	stamps', 'jetpack' ) }
								checked={ showTimeStamp }
								onChange={ ( value ) => setAttributes( { showTimeStamp: value } ) }
							/>
						</PanelBody>
					</Panel>
				</InspectorControls>

				<InnerBlocks
					template={ TRANSCRIPTION_TEMPLATE }
				/>
			</div>
		</TranscritptionContext.Provider>
	);
}

export default ConversationEdit;

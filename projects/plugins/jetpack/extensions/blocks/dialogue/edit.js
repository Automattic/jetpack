/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, RichText, BlockControls } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

import { Panel, PanelBody, ToggleControl, ToolbarGroup, Button } from '@wordpress/components';
import { useContext, useState, useEffect, useRef } from '@wordpress/element';
import { useSelect, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './editor.scss';
import ParticipantsDropdown, { ParticipantsControl } from './components/participants-control';
import { TimestampControl, TimestampDropdown } from './components/timestamp-control';
import { BASE_CLASS_NAME } from './utils';
import ConversationContext from '../conversation/components/context';
import { list as defaultParticipants } from '../conversation/participants.json';
import { STORE_ID as MEDIA_SOURCE_STORE_ID } from '../../store/media-source/constants';
import { MediaPlayerToolbarControl } from '../../shared/components/media-player-control';
import { convertSecondsToTimeCode } from '../../shared/components/media-player-control/utils';

function getParticipantBySlug( participants, slug ) {
	return find( participants, contextParticipant => contextParticipant.slug === slug );
}

const blockName = 'jetpack/dialogue';
const blockNameFallback = 'core/paragraph';

export default function DialogueEdit( {
	className,
	attributes,
	setAttributes,
	instanceId,
	clientId,
	context,
	onReplace,
	mergeBlocks,
} ) {
	const {
		content,
		participantLabel,
		placeholder,
		showTimestamp,
		timestamp,
		participantSlug,
	} = attributes;
	const [ isFocusedOnParticipantLabel, setIsFocusedOnParticipantLabel ] = useState( false );
	const richTextRef = useRef();

	const { prevBlock, mediaSource } = useSelect( select => {
		const prevPartClientId = select( 'core/block-editor' ).getPreviousBlockClientId( clientId );
		const previousBlock = select( 'core/block-editor' ).getBlock( prevPartClientId );

		return {
			prevBlock: previousBlock?.name === blockName ? previousBlock : null,
			mediaSource: select( MEDIA_SOURCE_STORE_ID ).getDefaultMediaSource(),
		};
	}, [] );

	// Block context integration.
	const participantsFromContext = context[ 'jetpack/conversation-participants' ];
	const showConversationTimestamps = context[ 'jetpack/conversation-showTimestamps' ];

	// Participants list.
	const participants = participantsFromContext?.length
		? participantsFromContext
		: defaultParticipants;

	const conversationParticipant = getParticipantBySlug( participants, participantSlug );

	// Conversation context. A bridge between dialogue and conversation blocks.
	const conversationBridge = useContext( ConversationContext );

	// Set initial attributes according to the context.
	useEffect( () => {
		// Bail when block already has an slug,
		// or when there is not a dialogue pre block.
		// or when there are not particpants,
		// or there is not conversation bridge.
		if ( participantLabel || ! prevBlock || ! participants?.length || ! conversationBridge ) {
			return;
		}

		const nextParticipant = conversationBridge.getNextParticipant(
			prevBlock?.attributes?.participantSlug
		);

		setAttributes( {
			participantLabel: nextParticipant.label,
			participantSlug: nextParticipant.slug,
			content: '',
		} );
	}, [ participantLabel, participants, prevBlock, setAttributes, conversationBridge ] );

	// Update dialog participant with conversation participant changes.
	useEffect( () => {
		if ( conversationParticipant?.slug !== participantSlug ) {
			return;
		}

		setAttributes( { participantLabel: conversationParticipant?.label } );
	}, [ conversationParticipant, participantSlug, setAttributes ] );

	// Update dialogue timestamp setting from parent conversation.
	useEffect( () => {
		setAttributes( { showTimestamp: showConversationTimestamps } );
	}, [ showConversationTimestamps, setAttributes ] );

	// Update participant slug in case
	// the participant is removed globally.
	// from the Conversation block.
	useEffect( () => {
		if ( ! participants?.length ) {
			return;
		}

		// Check if the participant has been removed from Conversation.
		if ( conversationParticipant ) {
			return;
		}

		// Set first participant as default.
		setAttributes( { participant: participants[ 0 ] } );
	}, [ participants, conversationParticipant, setAttributes ] );

	function setShowConversationTimestamps( value ) {
		conversationBridge.setAttributes( { showTimestamps: value } );
	}

	function setTimestamp( time ) {
		setAttributes( { timestamp: time } );
	}

	return (
		<div className={ className }>
			<BlockControls>
				<ToolbarGroup>
					<ParticipantsDropdown
						id={ `dialogue-${ instanceId }-participants-dropdown` }
						className={ BASE_CLASS_NAME }
						participants={ participants }
						label={ __( 'Participant', 'jetpack' ) }
						participantSlug={ participantSlug }
						onSelect={ setAttributes }
					/>
				</ToolbarGroup>

				{ mediaSource && (
					<MediaPlayerToolbarControl
						onTimeChange={ time => setTimestamp( convertSecondsToTimeCode( time ) ) }
					/>
				) }
			</BlockControls>

			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'Participant', 'jetpack' ) }>
						<ParticipantsControl
							className={ BASE_CLASS_NAME }
							participants={ participants }
							participantSlug={ participantSlug || '' }
							onSelect={ setAttributes }
						/>
					</PanelBody>

					{ !! mediaSource?.title && (
						<PanelBody title={ __( 'Podcast episode', 'jetpack' ) }>
							<p>{ mediaSource.title }</p>
						</PanelBody>
					) }

					<PanelBody title={ __( 'Timestamp', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Show conversation timestamps', 'jetpack' ) }
							checked={ showTimestamp }
							onChange={ setShowConversationTimestamps }
						/>

						{ showTimestamp && (
							<TimestampControl
								className={ BASE_CLASS_NAME }
								value={ timestamp }
								onChange={ setTimestamp }
							/>
						) }
					</PanelBody>
				</Panel>
			</InspectorControls>

			<div className={ `${ BASE_CLASS_NAME }__meta` }>
				<Button
					onFocus={ () => setIsFocusedOnParticipantLabel( true ) }
					onClick={ () => setIsFocusedOnParticipantLabel( true ) }
					className={ `${ BASE_CLASS_NAME }__participant` }
				>
					{ participantLabel }
				</Button>

				{ showTimestamp && (
					<TimestampDropdown
						className={ BASE_CLASS_NAME }
						value={ timestamp }
						onChange={ setTimestamp }
						shortLabel={ true }
					/>
				) }
			</div>

			<RichText
				ref={ richTextRef }
				identifier="content"
				tagName="p"
				className={ `${ BASE_CLASS_NAME }__content` }
				value={ content }
				onChange={ value => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				onSplit={ value => {
					if ( ! content?.length ) {
						return createBlock( blockNameFallback );
					}

					return createBlock( blockName, {
						...attributes,
						content: value,
					} );
				} }
				onReplace={ ( blocks, ...args ) => {
					// If transcription bridge doesn't exist,
					// then run the default replace process.
					if ( ! conversationBridge ) {
						return onReplace( blocks, ...args );
					}

					// Detect if the block content is empty.
					// If so, keep only one paragraph block,
					// in order to avoid duplicated blocks.
					if (
						blocks[ 0 ]?.name === blockNameFallback &&
						blocks[ 1 ]?.name === blockNameFallback &&
						! blocks[ 0 ]?.attributes.content &&
						! blocks[ 1 ]?.attributes.content
					) {
						dispatch( 'core/block-editor' ).selectBlock( blocks[ 0 ].clientId );
						return onReplace( [ blocks[ 0 ] ], ...args );
					}

					// When creating a new dialogue block in a `conversation` context,
					// try to assign the dialogue participant
					// with the next participant slug.

					// Pick up the next participant slug.
					const nextParticipant = conversationBridge.getNextParticipant(
						attributes.participantSlug
					);

					// Update new block attributes.
					blocks[ 1 ].attributes = {
						...blocks[ 1 ].attributes,
						participant: nextParticipant,
						timestamp: attributes.timestamp,
					};

					onReplace( blocks, ...args );
				} }
				onRemove={ onReplace ? () => onReplace( [] ) : undefined }
				placeholder={ placeholder || __( 'Write dialogue…', 'jetpack' ) }
				keepPlaceholderOnFocus={ true }
				isSelected={ ! isFocusedOnParticipantLabel }
				onFocus={ () => setIsFocusedOnParticipantLabel( false ) }
			/>
		</div>
	);
}

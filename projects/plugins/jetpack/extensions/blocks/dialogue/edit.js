/**
 * External dependencies
 */
import { find } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, RichText, BlockControls } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

import {
	Panel,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
	ToolbarButton,
	Button,
} from '@wordpress/components';
import { useContext, useState, useEffect, useRef } from '@wordpress/element';
import { useSelect, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './editor.scss';
import ParticipantsDropdown, {
	ParticipantsControl,
} from './components/participants-control';
import { TimestampControl, TimestampDropdown } from './components/timestamp-control';
import ConversationContext from '../conversation/components/context';
import { list as defaultParticipants } from '../conversation/participants.json';
import { formatUppercase } from '../../shared/icons';
import { STORE_ID as MEDIA_SOURCE_STORE_ID } from '../../store/media-source/constants';
import { MediaPlayerToolbarControl } from '../../shared/components/media-player-control';
import { convertSecondsToTimeCode } from '../../shared/components/media-player-control/utils';

function getParticipantBySlug( participants, slug ) {
	return find(
		participants,
		contextParticipant => contextParticipant.participantSlug === slug
	);
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
		participantSlug,
		timestamp,
		content,
		placeholder,
	} = attributes;
	const [ isFocusedOnParticipantLabel, setIsFocusedOnParticipantLabel ] = useState( false );
	const richTextRef = useRef();
	const baseClassName = 'wp-block-jetpack-dialogue';

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
	const showTimestamp = context[ 'jetpack/conversation-showTimestamps' ];

	// Participants list.
	const participants = participantsFromContext?.length
		? participantsFromContext
		: defaultParticipants;

	const currentParticipant = getParticipantBySlug( participants, participantSlug );
	const participantLabel = currentParticipant?.participant;

	// Conversation context. A bridge between dialogue and conversation blocks.
	const conversationBridge = useContext( ConversationContext );

	// Set initial attributes according to the context.
	useEffect( () => {
		// Bail when block already has an slug,
		// or when there is not a dialogue pre block.
		// or when there are not particpants,
		// or there is not conversation bridge.
		if (
			participantSlug ||
			! prevBlock ||
			! participants?.length ||
			! conversationBridge
		) {
			return;
		}

		const nextParticipantSlug = conversationBridge.getNextParticipantSlug(
			prevBlock?.attributes?.participantSlug
		);

		setAttributes( {
			...( prevBlock?.attributes || {} ),
			participantSlug: nextParticipantSlug,
			content: '',
		} );
	}, [ participantSlug, participants, prevBlock, setAttributes, conversationBridge ] );

	// Update participant slug in case
	// the participant is removed globally.
	// from the Conversation block.
	useEffect( () => {
		if ( ! participants?.length ) {
			return;
		}

		// Check if the participant has been removed from Conversation.
		if ( currentParticipant ) {
			return;
		}

		// Set first participant as default.
		setAttributes( { participantSlug: participants[ 0 ].participantSlug } );
	}, [ participants, currentParticipant, setAttributes ] );

	function hasStyle( style ) {
		return currentParticipant?.[ style ];
	}

	function toggleParticipantStyle( style ) {
		conversationBridge.updateParticipants( {
			participantSlug,
			[ style ]: ! currentParticipant[ style ],
		} );
	}

	function getParticipantLabelClass() {
		return classnames( `${ baseClassName }__participant`, {
			[ 'has-bold-style' ]: currentParticipant?.hasBoldStyle,
			[ 'has-italic-style' ]: currentParticipant?.hasItalicStyle,
			[ 'has-uppercase-style' ]: currentParticipant?.hasUppercaseStyle,
		} );
	}

	function setShowTimestamp( value ) {
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
						className={ baseClassName }
						participants={ participants }
						label={ __( 'Participant', 'jetpack' ) }
						participantSlug={ participantSlug }
						onSelect={ setAttributes }
					/>
				</ToolbarGroup>

				{ mediaSource && (
					<MediaPlayerToolbarControl
						onTimeChange={ ( time ) => setTimestamp( convertSecondsToTimeCode( time ) ) }
					/>
				) }

				{ currentParticipant && isFocusedOnParticipantLabel && (
					<ToolbarGroup>
						<ToolbarButton
							icon="editor-bold"
							isPressed={ hasStyle( 'hasBoldStyle' ) }
							onClick={ () => toggleParticipantStyle( 'hasBoldStyle' ) }
						/>

						<ToolbarButton
							icon="editor-italic"
							isPressed={ hasStyle( 'hasItalicStyle' ) }
							onClick={ () => toggleParticipantStyle( 'hasItalicStyle' ) }
						/>

						<ToolbarButton
							icon={ formatUppercase }
							isPressed={ hasStyle( 'hasUppercaseStyle' ) }
							onClick={ () => toggleParticipantStyle( 'hasUppercaseStyle' ) }
						/>
					</ToolbarGroup>
				) }
			</BlockControls>

			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'Participant', 'jetpack' ) }>
						<ParticipantsControl
							className={ baseClassName }
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
							onChange={ setShowTimestamp }
						/>

						{ showTimestamp && (
							<TimestampControl
								className={ baseClassName }
								value={ timestamp }
								onChange={ setTimestamp }
							/>
						) }
					</PanelBody>
				</Panel>
			</InspectorControls>

			<div className={ `${ baseClassName }__meta` }>
				<Button
					onFocus={ () => setIsFocusedOnParticipantLabel( true ) }
					onClick={ () => setIsFocusedOnParticipantLabel( true ) }
					className={ getParticipantLabelClass() }
				>
					{ participantLabel }
				</Button>

				{ showTimestamp && (
					<TimestampDropdown
						className={ baseClassName }
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
				className={ `${ baseClassName }__content` }
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
					const nextParticipantSlug = conversationBridge.getNextParticipantSlug(
						attributes.participantSlug
					);

					// Update new block attributes.
					blocks[ 1 ].attributes = {
						...blocks[ 1 ].attributes,
						participantSlug: nextParticipantSlug,
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

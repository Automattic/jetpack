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
import { useContext, useState, useEffect, useLayoutEffect, useRef } from '@wordpress/element';
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
import { convertTimeCodeToSeconds, convertSecondsToTimeCode } from '../../shared/components/media-player-control/utils';

function getParticipantBySlug( participants, slug ) {
	const participant = find(
		participants,
		contextParticipant => contextParticipant.participantSlug === slug
	);
	if ( participant ) {
		return participant;
	}

	// Fallback participant. First one in the list.
	return participants?.[ 0 ];
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
	isSelected,
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
		return {
			prevBlock: select( 'core/block-editor' ).getBlock( prevPartClientId ),
			mediaSource: select( MEDIA_SOURCE_STORE_ID ).getDefaultMediaSource(),
		};
	}, [] );

	// Block context integration.
	const participantsFromContext = context[ 'jetpack/conversation-participants' ];
	const showTimestampGlobally = context[ 'jetpack/conversation-showTimestamps' ];

	// Participants list.
	const participants = participantsFromContext?.length
		? participantsFromContext
		: defaultParticipants;

	const currentParticipantSlug = participantSlug;
	const currentParticipant = getParticipantBySlug( participants, currentParticipantSlug );
	const participantLabel = currentParticipant?.participant;

	// Conversation context. A bridge between dialogue and conversation blocks.
	const conversationBridge = useContext( ConversationContext );

	// Set initial attributes according to the context.
	useEffect( () => {
		// Bail when block already has an slug,
		// or participant doesn't exist.
		if ( participantSlug || ! participants?.length || ! conversationBridge ) {
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

	// in-sync mode
	const [ playerSyncMode, setPlayerSyncMode ] = useState( false );

	// Try to focus the RichText component when mounted.
	const hasContent = content?.length > 0;
	const richTextRefCurrent = richTextRef?.current;
	useLayoutEffect( () => {
		// Bail if component is not selected.
		if ( ! isSelected ) {
			return;
		}

		// Bail if context reference is not valid.
		if ( ! richTextRefCurrent ) {
			return;
		}

		// Bail if context is not empty.
		if ( hasContent ) {
			return;
		}

		// Focus the rich text component
		richTextRefCurrent.focus();
	}, [ isSelected, hasContent, richTextRefCurrent ] );

	const showTimestamp = showTimestampGlobally;

	function hasStyle( style ) {
		return currentParticipant?.[ style ];
	}

	function toggleParticipantStyle( style ) {
		conversationBridge.updateParticipants( {
			participantSlug: currentParticipantSlug,
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

	function updateTimestampFromMediaPlayerControl( time ) {
		setAttributes( { timestamp: convertSecondsToTimeCode( time ) } );
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

				<MediaPlayerToolbarControl
					customTimeToPlay={ convertTimeCodeToSeconds( timestamp ) }
					onTimeChange={ updateTimestampFromMediaPlayerControl }
					syncMode={ playerSyncMode }
					onSyncModeToggle={ setPlayerSyncMode }
				/>

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
								skipForwardTime = { false }
								jumpBackTime = { false }
								className={ baseClassName }
								value={ timestamp }
								onChange={ updateTimestampFromMediaPlayerControl }
								isDisabled={ playerSyncMode }
							/>
						) }
					</PanelBody>
				</Panel>
			</InspectorControls>

			<div className={ `${ baseClassName }__meta` }>
				<Button
					onFocus={ () => setIsFocusedOnParticipantLabel( true ) }
					className={ getParticipantLabelClass() }
				>
					{ participantLabel }
				</Button>

				{ showTimestamp && (
					<TimestampDropdown
						className={ baseClassName }
						value={ timestamp }
						onChange={ updateTimestampFromMediaPlayerControl }
						shortLabel={ true }
						skipForwardTime = { false }
						jumpBackTime = { false }
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

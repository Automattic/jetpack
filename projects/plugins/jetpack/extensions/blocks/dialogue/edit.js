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
} from '@wordpress/components';
import { useContext, useState, useEffect, useLayoutEffect, useRef } from '@wordpress/element';
import { useSelect, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './editor.scss';
import ParticipantsDropdown, {
	ParticipantsControl,
	ParticipantControl,
} from './components/participants-control';
import TimestampControl, { TimestampDropdown } from './components/timestamp-control';
import ConversationContext from '../conversation/components/context';
import {
	slug as defaultParticipantSlug,
	list as defaultParticipants,
} from '../conversation/participants.json';
import { formatUppercase } from '../../shared/icons';
import MediaPlayerControl from '../../shared/components/media-player-control';

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
		participant,
		participantSlug,
		timestamp,
		showTimestamp: showTimestampLocally,
		content,
		placeholder,
	} = attributes;
	const [ isFocusedOnParticipantLabel, setIsFocusedOnParticipantLabel ] = useState( false );
	const richTextRef = useRef();
	const baseClassName = 'wp-block-jetpack-dialogue';

	const { prevBlock } = useSelect( select => {
		// Pick the previous block atteobutes from the state.
		const prevPartClientId = select( 'core/block-editor' ).getPreviousBlockClientId( clientId );

		return {
			prevBlock: select( 'core/block-editor' ).getBlock( prevPartClientId ),
		}
	}, [] );

	// Block context integration.
	const participantsFromContext = context[ 'jetpack/conversation-participants' ];
	const showTimestampGlobally = context[ 'jetpack/conversation-showTimestamps' ];

	// Participants list.
	const participants = participantsFromContext?.length
		? participantsFromContext
		: defaultParticipants;

	const isCustomParticipant = !! participant && ! participantSlug;
	const currentParticipantSlug = isCustomParticipant ? defaultParticipantSlug : participantSlug;
	const currentParticipant = getParticipantBySlug( participants, currentParticipantSlug );
	const participantLabel = isCustomParticipant ? participant : currentParticipant?.participant;

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

	const showTimestamp = isCustomParticipant ? showTimestampLocally : showTimestampGlobally;

	/**
	 * Helper to check if the gven style is set, or not.
	 * It handles local and global (conversation) level.
	 *
	 * @param {string} style - style to check.
	 * @returns {boolean} True if the style is defined. Otherwise, False.
	 */
	function hasStyle( style ) {
		if ( isCustomParticipant || ! participantsFromContext ) {
			return attributes?.[ style ];
		}

		return currentParticipant?.[ style ];
	}

	/**
	 * Helper to toggle the value of the given style
	 * It handles local and global (conversation) level.
	 *
	 * @param {string} style - style to toggle.
	 * @returns {void}
	 */
	function toggleParticipantStyle( style ) {
		if ( isCustomParticipant || ! participantsFromContext ) {
			return setAttributes( { [ style ]: ! attributes[ style ] } );
		}

		conversationBridge.updateParticipants( {
			participantSlug: currentParticipantSlug,
			[ style ]: ! currentParticipant[ style ],
		} );
	}

	/**
	 * Helper to build the CSS classes for the participant label.
	 * It handles local and global (conversation) level.
	 *
	 * @returns {string} Participant CSS class.
	 */
	function getParticipantLabelClass() {
		if ( isCustomParticipant || ! participantsFromContext ) {
			return classnames( `${ baseClassName }__participant`, {
				[ 'has-bold-style' ]: attributes?.hasBoldStyle,
				[ 'has-italic-style' ]: attributes?.hasItalicStyle,
				[ 'has-uppercase-style' ]: attributes?.hasUppercaseStyle,
			} );
		}

		return classnames( `${ baseClassName }__participant`, {
			[ 'has-bold-style' ]: currentParticipant?.hasBoldStyle,
			[ 'has-italic-style' ]: currentParticipant?.hasItalicStyle,
			[ 'has-uppercase-style' ]: currentParticipant?.hasUppercaseStyle,
		} );
	}

	function setShowTimestamp( value ) {
		if ( isCustomParticipant || ! participantsFromContext ) {
			return setAttributes( { showTimestamp: value } );
		}

		conversationBridge.setAttributes( { showTimestamps: value } );
	}

	return (
		<div className={ className }>
			<BlockControls>
				<MediaPlayerControl />
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
						<ParticipantControl
							className={ className }
							participantValue={ participant }
							onChange={ setAttributes }
						/>
					</PanelBody>

					<PanelBody title={ __( 'Timestamp', 'jetpack' ) }>
						<ToggleControl
							label={
								isCustomParticipant
									? __( 'Show', 'jetpack' )
									: __( 'Show conversation timestamps', 'jetpack' )
							}
							checked={ showTimestamp }
							onChange={ setShowTimestamp }
						/>

						{ showTimestamp && (
							<TimestampControl
								className={ baseClassName }
								value={ timestamp }
								onChange={ newTimestampValue => setAttributes( { timestamp: newTimestampValue } ) }
							/>
						) }
					</PanelBody>
				</Panel>
			</InspectorControls>

			<div className={ `${ baseClassName }__meta` }>
				<div onFocus={ () => setIsFocusedOnParticipantLabel( true ) }>
					<ParticipantsDropdown
						id={ `dialogue-${ instanceId }-participants-dropdown` }
						className={ baseClassName }
						labelClassName={ getParticipantLabelClass() }
						participants={ participants }
						participantLabel={ participantLabel }
						participantSlug={ participantSlug }
						participant={ participant }
						onSelect={ setAttributes }
						onChange={ setAttributes }
					/>
				</div>

				{ showTimestamp && (
					<TimestampDropdown
						className={ baseClassName }
						value={ timestamp }
						onChange={ newTimestampValue => {
							setAttributes( { timestamp: newTimestampValue } );
						} }
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

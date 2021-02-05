/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, RichText, BlockControls } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Panel, PanelBody, ToggleControl } from '@wordpress/components';
import { useContext, useEffect, useRef, useReducer, useState } from '@wordpress/element';
import { useSelect, dispatch } from '@wordpress/data';
import { useDebounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './editor.scss';
import { ParticipantsControl, SpeakerEditControl } from './components/participants-control';
import { TimestampControl, TimestampDropdown } from './components/timestamp-control';
import { BASE_CLASS_NAME } from './utils';
import ConversationContext from '../conversation/components/context';
import { STORE_ID as MEDIA_SOURCE_STORE_ID } from '../../store/media-source/constants';
import { MediaPlayerToolbarControl } from '../../shared/components/media-player-control';
import { convertSecondsToTimeCode } from '../../shared/components/media-player-control/utils';
import { getParticipantBySlug, getParticipantByLabel } from '../conversation/utils';

const blockName = 'jetpack/dialogue';
const blockNameFallback = 'core/paragraph';

const speakersControlReducer = state => state + 1;

export default function DialogueEdit( {
	className,
	attributes,
	setAttributes,
	context,
	onReplace,
	mergeBlocks,
	isSelected,
} ) {
	const {
		content,
		label,
		slug,
		placeholder,
		showTimestamp,
		timestamp,
	} = attributes;
	const [ isContentIsSelected, setIsContentSelected ] = useState( false );

	const mediaSource = useSelect(
		select => select( MEDIA_SOURCE_STORE_ID ).getDefaultMediaSource(),
		[]
	);

	// we use a reducer to force re-rendering the SpeakerEditControl,
	// passing the `reRenderingKey` as property of the component.
	// It's required when we want to update the options in the autocomplete,
	// or when we need to hide it.
	const [ reRenderingKey, triggerRefreshAutocomplete ] = useReducer( speakersControlReducer, 0 );

	const contentRef = useRef();

	// Block context integration.
	const participantsFromContext = context[ 'jetpack/conversation-participants' ];
	const showConversationTimestamps = context[ 'jetpack/conversation-showTimestamps' ];

	// Participants list.
	const participants = participantsFromContext?.length
		? participantsFromContext
		: [];

	const conversationParticipant = getParticipantBySlug( participants, slug );

	// Conversation context. A bridge between dialogue and conversation blocks.
	const conversationBridge = useContext( ConversationContext );

	const debounceSetDialoguesAttrs = useDebounce( setAttributes, 100 );

	// Update dialogue participant with conversation participant changes.
	useEffect( () => {
		if ( ! conversationParticipant ) {
			return;
		}

		if ( conversationParticipant.slug !== slug ) {
			return;
		}

		// Do not update current Dialogue block.
		if ( isSelected ) {
			return;
		}

		debounceSetDialoguesAttrs( {
			label: conversationParticipant.label,
		} );
	}, [ conversationParticipant, debounceSetDialoguesAttrs, isSelected, slug ] );

	// Update dialogue timestamp setting from parent conversation.
	useEffect( () => {
		setAttributes( { showTimestamp: showConversationTimestamps } );
	}, [ showConversationTimestamps, setAttributes ] );

	function setShowConversationTimestamps( value ) {
		conversationBridge.setAttributes( { showTimestamps: value } );
	}

	function setTimestamp( time ) {
		setAttributes( { timestamp: time } );
	}

	return (
		<div className={ className }>
			<BlockControls>
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
							slug={ slug || '' }
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
				<SpeakerEditControl
					className={ `${ BASE_CLASS_NAME }__participant` }
					label={ label }
					participant={ conversationParticipant }
					participants={ participants }
					isSelected={ isSelected }
					reRenderingKey={ `re-render-key${ reRenderingKey }` }
					onParticipantChange={ ( updatedParticipant ) => {
						setAttributes( { label: updatedParticipant } );
					} }
					onSelect={ ( selectedParticipant ) => {
						setAttributes( selectedParticipant );
					} }

					onClean={ () => {
						setAttributes( { slug: null, label: '' } );
					} }

					onAdd={ ( newLabel ) => {
						triggerRefreshAutocomplete();

						const newParticipant = conversationBridge.addNewParticipant( newLabel );
						if ( ! newParticipant ) {
							return;
						}

						setAttributes( newParticipant );
					} }
					onUpdate={ ( participant ) => {
						conversationBridge.updateParticipants( participant );
					} }
					onFocus={ () => setIsContentSelected( false ) }
				/>

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
				ref={ contentRef }
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

					// Update new block attributes.
					blocks[ 1 ].attributes = {
						timestamp: attributes.timestamp, // <- keep same timestamp value.
					};

					onReplace( blocks, ...args );
				} }
				onRemove={ onReplace ? () => onReplace( [] ) : undefined }
				placeholder={ placeholder || __( 'Write dialogue…', 'jetpack' ) }
				keepPlaceholderOnFocus={ true }
				isSelected={ isContentIsSelected }
				onFocus={ ( event ) => {
					setIsContentSelected( true );

					if ( ! label ) {
						triggerRefreshAutocomplete();
						return;
					}

					event.preventDefault();

					// Provably, we should add a new participant from here.
					// onFocusOutside is not supported by some Gutenberg versions.
					// Take a look at <SpeakerEditControl /> to get more info.
					const participantExists = getParticipantByLabel( participants, label );

					// If participant exists let's update it.
					if ( participantExists ) {
						setAttributes( participantExists );
					} else {
						// Otherwise, let's create a new one...
						const newParticipant = conversationBridge.addNewParticipant( label );
						if ( ! newParticipant ) {
							return;
						}

						// ... and update the dialogue with these new values.
						setAttributes( newParticipant );
					}

					triggerRefreshAutocomplete();
				} }
			/>
		</div>
	);
}

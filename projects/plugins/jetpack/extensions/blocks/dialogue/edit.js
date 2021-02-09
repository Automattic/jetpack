/**
 * External dependencies
 */
import { debounce } from 'lodash';
import { useMemoOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	RichText,
	BlockControls,
	withColors,
	PanelColorSettings,
 } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Panel, PanelBody, ToggleControl } from '@wordpress/components';
import { useContext, useEffect, useRef } from '@wordpress/element';
import { useSelect, dispatch } from '@wordpress/data';
import { useDebounce, compose } from '@wordpress/compose';

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
import { getParticipantBySlug } from '../conversation/utils';

const blockName = 'jetpack/dialogue';
const blockNameFallback = 'core/paragraph';

const useDebounceWithFallback = useDebounce
	? useDebounce
	: function useDebounceFallback( ...args ) {
		const debounced = useMemoOne( () => debounce( ...args ), args );
		useEffect( () => () => debounced.cancel(), [ debounced ] );
		return debounced;
	};

function DialogueEdit( {
	className,
	attributes,
	setAttributes,
	context,
	onReplace,
	mergeBlocks,
	isSelected,

	labelTextColor,
	setLabelTextColor,
	labelBackgroundColor,
	setLabelBackgroundColor,
} ) {
	const {
		content,
		label,
		slug,
		placeholder,
		showTimestamp,
		timestamp,
	} = attributes;

	const mediaSource = useSelect(
		select => select( MEDIA_SOURCE_STORE_ID ).getDefaultMediaSource(),
		[]
	);

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

	// Debounced function to keep all sibling Dialogue blocks in-sync.
	const syncSpeakersGlobally = useDebounceWithFallback( ( newAttributes, colors ) => {
		// Check whether it needs to update the block label.
		if ( newAttributes?.label && newAttributes.label !== label ) {
			setAttributes( newAttributes );
		}

		if ( colors?.color && colors.color !== labelTextColor.color ) {
			setLabelTextColor( colors.color );
		}

		if ( colors?.backgroundColor && colors.backgroundColor !== labelBackgroundColor.color ) {
			setLabelBackgroundColor( colors.backgroundColor );
		}
	}, 250 );

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

		syncSpeakersGlobally(
			{
				label: conversationParticipant.label,
			},
			{
				color: conversationParticipant?.color,
				backgroundColor: conversationParticipant?.backgroundColor,
			}
		);
	}, [ conversationParticipant, syncSpeakersGlobally, isSelected, slug ] );

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

	function setLabelColorHandler( type ) {
		return function( color ) {
			if ( type === 'labelTextColor' ) {
				setLabelTextColor( color );
				return conversationBridge.updateParticipants( {
					...conversationParticipant,
					color,
				} );
			}

			setLabelBackgroundColor( color );

			conversationBridge.updateParticipants( {
				...conversationParticipant,
				backgroundColor: color,
			} );
		};
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

					<PanelColorSettings
						initialOpen={ false }
						title={ __( 'Color Settings', 'jetpack' ) }
						colorSettings={ [
							{
								value: labelTextColor.color,
								onChange: setLabelColorHandler( 'labelTextColor' ),
								label: __( 'Label color', 'jetpack' ),
							},

							{
								value: labelBackgroundColor.color,
								onChange: setLabelColorHandler( 'labelBackgroundColor' ),
								label: __( 'Label Background color', 'jetpack' ),
							},
						] }
					/>

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
					transcriptRef={ contentRef }
					color={ labelTextColor }
					backgroundColor={ labelBackgroundColor }
					onParticipantChange={ ( updatedParticipant ) => {
						setAttributes( { label: updatedParticipant } );
					} }
					onSelect={ ( selectedParticipant ) => {
						setAttributes( selectedParticipant );

						if ( selectedParticipant?.color ) {
							setLabelTextColor( selectedParticipant.color );
						}

						if ( selectedParticipant?.backgroundColor ) {
							setLabelBackgroundColor( selectedParticipant.backgroundColor );
						}
					} }

					onClean={ () => {
						setAttributes( { slug: null, label: '' } );
					} }

					onAdd={ ( newLabel ) => {
						const newParticipant = conversationBridge.addNewParticipant( newLabel );
						setAttributes( newParticipant );
					} }
					onUpdate={ ( participant ) => {
						conversationBridge.updateParticipants( participant );
					} }
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
			/>
		</div>
	);
}

export default compose( [
	withColors(
		{ labelTextColor: 'color', labelBackgroundColor: 'background-color' },
	),
] )( DialogueEdit );

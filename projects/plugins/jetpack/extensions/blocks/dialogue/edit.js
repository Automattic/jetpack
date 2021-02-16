/**
 * External dependencies
 */
import { debounce } from 'lodash';
import { useMemoOne } from 'use-memo-one';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, RichText, BlockControls } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useContext, useEffect, useRef } from '@wordpress/element';
import { dispatch, useSelect, useDispatch } from '@wordpress/data';
import { Panel, PanelBody } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './editor.scss';
import { ParticipantsControl, SpeakerEditControl } from './components/participants-control';
import { TimestampControl, TimestampEditControl } from './components/timestamp-control';
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

export default function DialogueEdit( {
	className,
	attributes,
	setAttributes,
	context,
	onReplace,
	mergeBlocks,
	isSelected,
} ) {
	const { content, label, slug, placeholder, showTimestamp, timestamp } = attributes;

	const { mediaSource, mediaCurrentTime, mediaDuration, mediaDomReference } = useSelect( select => {
		const {
			getDefaultMediaSource,
			getMediaSourceCurrentTime,
			getMediaSourceDuration,
			getMediaSourceDomReference,
		} = select( MEDIA_SOURCE_STORE_ID );

		return {
			mediaSource: getDefaultMediaSource(),
			mediaCurrentTime: getMediaSourceCurrentTime(),
			mediaDuration: getMediaSourceDuration(),
			mediaDomReference: getMediaSourceDomReference(),
		};
	}, [] );

	const { playMediaSource, setMediaSourceCurrentTime } = useDispatch( MEDIA_SOURCE_STORE_ID );
	const contentRef = useRef();

	// Block context integration.
	const participantsFromContext = context[ 'jetpack/conversation-participants' ];

	// Participants list.
	const participants = participantsFromContext?.length ? participantsFromContext : [];

	const conversationParticipant = getParticipantBySlug( participants, slug );

	// Conversation context. A bridge between dialogue and conversation blocks.
	const conversationBridge = useContext( ConversationContext );

	const debounceSetDialoguesAttrs = useDebounceWithFallback( setAttributes, 250 );

	// Update dialogue participant with conversation participant changes.
	useEffect( () => {
		// Do not update current Dialogue block.
		if ( isSelected ) {
			return;
		}

		// When no context, nothing to do.
		if ( ! conversationParticipant ) {
			return;
		}

		// Only take care of Dialogue with same speaker.
		if ( conversationParticipant.slug !== slug ) {
			return;
		}

		debounceSetDialoguesAttrs( {
			label: conversationParticipant.label,
		} );
	}, [ conversationParticipant, debounceSetDialoguesAttrs, isSelected, slug ] );

	function setTimestamp( time ) {
		setAttributes( { timestamp: time } );
	}

	function audioPlayback( time ) {
		if ( mediaDomReference ) {
			mediaDomReference.currentTime = time;
		}
		setMediaSourceCurrentTime( time );
		playMediaSource();
	}

	return (
		<div className={ className }>
			<BlockControls>
				{ mediaSource && (
					<MediaPlayerToolbarControl
						onTimestampClick={ time => {
							setAttributes( { showTimestamp: true } );
							setTimestamp( convertSecondsToTimeCode( time ) );
						} }
					/>
				) }
			</BlockControls>

			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'Speaker', 'jetpack' ) }>
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

					{ mediaSource && showTimestamp && (
						<PanelBody title={ __( 'Timestamp', 'jetpack' ) }>
							<TimestampControl
								className={ BASE_CLASS_NAME }
								value={ timestamp }
								onChange={ setTimestamp }
								mediaSource={ mediaSource }
								duration={ mediaDuration }
							/>
						</PanelBody>
					) }
				</Panel>
			</InspectorControls>

			<div className={ classnames( `${ BASE_CLASS_NAME }__meta`, {
				'has-not-media-source': ! mediaSource,
			} ) }>
				<SpeakerEditControl
					className={ `${ BASE_CLASS_NAME }__participant` }
					label={ label }
					participant={ conversationParticipant }
					participants={ participants }
					transcriptRef={ contentRef }
					onParticipantChange={ updatedParticipant => {
						setAttributes( { label: updatedParticipant } );
					} }
					onSelect={ setAttributes }
					onClean={ () => {
						setAttributes( { slug: null, label: '' } );
					} }
					onAdd={ newLabel => {
						const newParticipant = conversationBridge.addNewParticipant( {
							label: newLabel,
							slug,
						} );
						setAttributes( newParticipant );
					} }
					onUpdate={ participant => {
						conversationBridge.updateParticipants( participant );
					} }
				/>

				{ mediaSource && (
					<TimestampEditControl
						className={ BASE_CLASS_NAME }
						show={ showTimestamp }
						isSelected={ isSelected }
						value={ timestamp }
						mediaCurrentTime={ mediaCurrentTime }
						onChange={ setTimestamp }
						onToggle={ show => setAttributes( { showTimestamp: show } ) }
						onPlayback={ audioPlayback }
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

					onReplace( blocks, ...args );
				} }
				onRemove={ onReplace ? () => onReplace( [] ) : undefined }
				placeholder={ placeholder || __( 'Write dialogue…', 'jetpack' ) }
				keepPlaceholderOnFocus={ true }
			/>
		</div>
	);
}

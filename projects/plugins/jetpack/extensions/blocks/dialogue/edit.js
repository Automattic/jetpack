import { InspectorControls, RichText, BlockControls } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Panel, PanelBody } from '@wordpress/components';
import { dispatch, useSelect, useDispatch } from '@wordpress/data';
import { useContext, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import './editor.scss';
import { MediaPlayerToolbarControl } from '../../shared/components/media-player-control';
import { convertSecondsToTimeCode } from '../../shared/components/media-player-control/utils';
import { STORE_ID as MEDIA_SOURCE_STORE_ID } from '../../store/media-source/constants';
import ConversationContext from '../conversation/components/context';
import { getParticipantBySlug } from '../conversation/utils';
import { ParticipantsControl, SpeakerEditControl } from './components/participants-control';
import { TimestampControl, TimestampEditControl } from './components/timestamp-control';
import { BASE_CLASS_NAME } from './utils';

const blockName = 'jetpack/dialogue';
const blockNameFallback = 'core/paragraph';

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

	const {
		mediaSource,
		mediaCurrentTime,
		mediaDuration,
		mediaDomReference,
		isMultipleSelection,
	} = useSelect( select => {
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
			isMultipleSelection: select( 'core/block-editor' ).getMultiSelectedBlocks().length > 0,
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

	// Update dialogue participant with conversation participant changes.
	useEffect( () => {
		// Do not update when multi-blocks selected.
		if ( isMultipleSelection ) {
			return;
		}

		// Do not update current block.
		if ( isSelected ) {
			return;
		}

		// Bail early when bridge is not ready.
		if ( ! conversationParticipant ) {
			return;
		}

		// Only take care of blocks with same speaker slug.
		if ( conversationParticipant.slug !== slug ) {
			return;
		}

		// Only update if the label has changed.
		if ( conversationParticipant.label === label ) {
			return;
		}

		setAttributes( {
			label: conversationParticipant.label,
		} );
	}, [ conversationParticipant, label, slug, isMultipleSelection, isSelected, setAttributes ] );

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

			<div
				className={ classnames( `${ BASE_CLASS_NAME }__meta`, {
					'has-not-media-source': ! mediaSource,
				} ) }
			>
				<SpeakerEditControl
					className={ `${ BASE_CLASS_NAME }__participant` }
					label={ label }
					participant={ conversationParticipant }
					participants={ participants }
					transcriptRef={ contentRef }
					onParticipantChange={ updatedParticipant => {
						setAttributes( { label: updatedParticipant } );
					} }
					onSelect={ selectedParticipant => {
						if ( isMultipleSelection ) {
							return;
						}

						setAttributes( selectedParticipant );
					} }
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

					// Copy attrs for the new block
					// only if content is not empty.
					const newAttributes = value?.length ? attributes : {};

					return createBlock( blockName, {
						...newAttributes,
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
			/>
		</div>
	);
}

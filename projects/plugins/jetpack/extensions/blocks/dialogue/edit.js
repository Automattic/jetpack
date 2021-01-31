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
} from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { useSelect, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './editor.scss';
import { ParticipantsEditMenu, ParticipantsDropdown, ParticipantsEditControl } from './components/participants-control';
import { TimestampControl, TimestampDropdown } from './components/timestamp-control';
import ConversationContext from '../conversation/components/context';
import { list as defaultParticipants } from '../conversation/participants.json';
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
		content,
		placeholder,
	} = attributes;
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

	// console.log( 'participantSlug: ', participantSlug );

	const participantLabel = currentParticipant?.participant;
	// const [ participantLabel, setParticipantLabel ] = useState( '' );

	// Conversation context. A bridge between dialogue and conversation blocks.
	const conversationBridge = useContext( ConversationContext );

	// // Set initial attributes according to the context.
	// useEffect( () => {
	// 	// Bail when block already has an slug,
	// 	// or when there is not a dialogue pre block.
	// 	// or when there are not particpants,
	// 	// or there is not conversation bridge.
	// 	if (
	// 		participantSlug ||
	// 		! prevBlock ||
	// 		! participants?.length ||
	// 		! conversationBridge
	// 	) {
	// 		return;
	// 	}

	// 	const nextParticipantSlug = conversationBridge.getNextParticipantSlug(
	// 		prevBlock?.attributes?.participantSlug
	// 	);

	// 	setAttributes( {
	// 		...( prevBlock?.attributes || {} ),
	// 		participantSlug: nextParticipantSlug,
	// 		content: '',
	// 	} );
	// }, [ participantSlug, participants, prevBlock, setAttributes, conversationBridge ] );

	// Update participant slug in case
	// the participant is removed globally.
	// from the Conversation block.
	// useEffect( () => {
	// 	if ( ! participants?.length ) {
	// 		return;
	// 	}

	// 	// Check if the participant has been removed from Conversation.
	// 	if ( currentParticipant ) {
	// 		return;
	// 	}

	// 	// Set first participant as default.
	// 	setAttributes( { participantSlug: participants[ 0 ].participantSlug } );
	// }, [ participants, currentParticipant, setAttributes ] );

	/*
	 * Update the participant label of all other Dialogue blocks,
	 * following the current Dialogue block.
	 */
	// useEffect( () => {
	// 	if ( ! currentParticipant ) {
	// 		return;
	// 	}

	// 	if ( participantSlug !== currentParticipant.participantSlug ) {
	// 		return;
	// 	}

	// 	if ( isSelected ) {
	// 		return;
	// 	}

	// 	setParticipantLabel( currentParticipant.participant );
	// }, [ currentParticipant, participantSlug, isSelected ] );

	function setShowTimestamp( value ) {
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
						onTimeChange={ ( time ) => setTimestamp( convertSecondsToTimeCode( time ) ) }
					/>
				) }

				<ToolbarGroup>
					<ParticipantsDropdown
						className={ baseClassName }
						participants={ participants }
						label={ false }
						participantSlug={ participantSlug }
						onSelect={ setAttributes }
						editMode={ false }
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'Participant', 'jetpack' ) }>
						<ParticipantsEditMenu
							className={ baseClassName }
							participants={ participants }
							participantSlug={ participantSlug }
							onParticipantSelect={ setAttributes }
							onParticipantAdd={ conversationBridge.addNewParticipant }
							onParticipantChange={ conversationBridge.updateParticipants }
							onParticipantDelete={ conversationBridge.deleteParticipant }
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
				{/* <ParticipantsDropdown
					className={ baseClassName }
					labelClassName={ getParticipantLabelClass() }
					participants={ participants }
					label={ participantLabel }
					participantSlug={ participantSlug }
					onParticipantSelect={ setAttributes }
					onParticipantAdd={ conversationBridge.addNewParticipant }
					onParticipantChange={ conversationBridge.updateParticipants }
					onParticipantDelete={ conversationBridge.deleteParticipant }
					onFocus={ () => setIsFocusedOnParticipantLabel( true ) }
					editMode={ true }
					icon={ null }
				/> */}

				<ParticipantsEditControl
					label={ participantLabel }
					participant={ participant }
					onParticipantChange={ ( value ) => setAttributes( { participant: value } ) }
					participants={ participants }
					participantSlug={ participantSlug }
					currentParticipant={ currentParticipant }
					isSelected={ isSelected }
					onSelect={ ( { slug } ) => {
						console.warn( '{onSelect}' );
						console.log( 'slug: ', slug );

						setAttributes( {
							participantSlug: slug,
						} );
						console.log( '- - - - -' );
					} }

					onClean = { () => {
						console.warn( '{onClean}' );
						setAttributes( { participantSlug: null } );
						console.log( '- - - - -' );
					} }

					onAdd={ ( newValue ) => {
						console.warn( '{onAdd}' );
						console.log( 'newValue: ', newValue );
						if ( ! newValue?.length ) {
							console.error( 'NO add with empty strings!' );
							return;
						}
						const newParticipant = conversationBridge.addNewParticipant( newValue );
						if ( ! newParticipant ) {
							console.warn( 'Same value!' );
							return;
						}

						setAttributes( {
							participantSlug: newParticipant.participantSlug,
						} );
						console.log( '- - - - -' );
					} }

					onUpdate={ ( { value, slug } ) => {
						console.warn( '{onUpdate}' );
						console.log( 'value: ', value );
						console.log( 'slug: ', slug );

						conversationBridge.updateParticipants( {
							participant: value,
							participantSlug: slug,
						} );
						console.log( '- - - - -' );
					 } }
				/>

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

					// // When creating a new dialogue block in a `conversation` context,
					// // try to assign the dialogue participant
					// // with the next participant slug.

					// // Pick up the next participant slug.
					// const nextParticipantSlug = conversationBridge.getNextParticipantSlug(
					// 	attributes.participantSlug
					// );

					// // Update new block attributes.
					// blocks[ 1 ].attributes = {
					// 	...blocks[ 1 ].attributes,
					// 	participantSlug: nextParticipantSlug,
					// 	timestamp: attributes.timestamp,
					// };

					onReplace( blocks, ...args );
				} }
				onRemove={ onReplace ? () => onReplace( [] ) : undefined }
				placeholder={ placeholder || __( 'Dialogue…', 'jetpack' ) }
				// isSelected={ ! isFocusedOnParticipantLabel }
				// onFocus={ () => setIsFocusedOnParticipantLabel( false ) }
			/>
		</div>
	);
}

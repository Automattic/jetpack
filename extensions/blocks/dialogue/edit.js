/* global mejs */

/**
 * External dependencies
 */
import { find } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	RichText,
	BlockControls,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Panel,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useContext, useState, } from '@wordpress/element';

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
import { formatUppercase, controlForwardFive, controlBackFive } from '../../shared/icons';
import { STORE_ID } from '../../store/media-source';

function getParticipantBySlug( participants, slug ) {
	const participant = find( participants, ( contextParticipant ) => contextParticipant.participantSlug === slug );
	if ( participant ) {
		return participant;
	}

	// Fallback participant. First one in the list.
	return participants?.[ 0 ];
}

const blockName = 'jetpack/dialogue';
const blockNameFallback = 'core/paragraph';

export default function DialogueEdit ( {
	className,
	attributes,
	setAttributes,
	instanceId,
	context,
	onReplace,
	mergeBlocks,
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

	// Block context integration.
	const participantsFromContext = context[ 'jetpack/conversation-participants' ];
	const showTimestampGlobally = context[ 'jetpack/conversation-showTimestamps' ];

	const { toggleMediaSource, setMediaPosition, playMediaInPosition } = useDispatch( STORE_ID );
	const currentMediaSource = useSelect( select => select( STORE_ID ).getCurrent(), [] );

	const togglePlayer = () => toggleMediaSource( currentMediaSource.id );
	const setPosition = ( pos ) => setMediaPosition( currentMediaSource.id, mejs.Utils.timeCodeToSeconds( pos ) );
	const playInPosition = ( pos ) => playMediaInPosition( currentMediaSource.id, mejs.Utils.timeCodeToSeconds( pos ) );

	const setTimestamp = ( newTimestampValue, offeset = 0 ) => {
		if ( offeset ) {
			newTimestampValue = mejs.Utils.secondsToTimeCode( mejs.Utils.timeCodeToSeconds( newTimestampValue ) + offeset );
			newTimestampValue = newTimestampValue < 0 ? 0 : newTimestampValue;
		}

		setPosition( newTimestampValue );
		setAttributes( { timestamp: newTimestampValue } );
	};

	// Participants list.
	const participants = participantsFromContext?.length ? participantsFromContext : defaultParticipants;

	const isCustomParticipant = !! participant && ! participantSlug;
	const currentParticipantSlug = isCustomParticipant ? defaultParticipantSlug : participantSlug;
	const currentParticipant = getParticipantBySlug( participants, currentParticipantSlug );
	const participantLabel = isCustomParticipant ? participant : currentParticipant?.participant;

	const showTimestamp = isCustomParticipant ? showTimestampLocally : showTimestampGlobally;

	// Conversation context. A bridge between dialogue and conversation blocks.
	const transcritionBridge = useContext( ConversationContext );

	const baseClassName = 'wp-block-jetpack-dialogue';

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

		transcritionBridge.updateParticipants( {
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

		transcritionBridge.setAttributes( { showTimestamps: value } );
	}

	return (
		<div className={ className }>
			<BlockControls>
				{ showTimestamp && currentMediaSource && (
					<ToolbarGroup>
						<ToolbarButton
							icon={ controlBackFive }
							onClick={ () => setTimestamp( timestamp, -5 ) }
						/>

						<ToolbarButton
							icon={ currentMediaSource.status === 'is-paused'
								? 'controls-play'
								: 'controls-pause'
							}
							onClick={ () => {
								if ( currentMediaSource.status === 'is-paused' ) {
									return playInPosition( timestamp );
								}

								togglePlayer();
							} }
						/>
						<ToolbarButton
							icon={ controlForwardFive }
							onClick={ () => setTimestamp( timestamp, 5 ) }
						/>
					</ToolbarGroup>
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
						<ParticipantControl
							className={ className }
							participantValue={ participant }
							onChange={ setAttributes }
						/>
					</PanelBody>

					<PanelBody title={ __( 'Timestamp', 'jetpack' ) }>
						<ToggleControl
							label={ isCustomParticipant
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
								onChange={ setTimestamp }
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
						onChange={ setTimestamp }
						shortLabel={ true }
					/>
				) }
			</div>

			<RichText
				identifier="content"
				className={ `${ baseClassName }__content` }
				value={ content }
				onChange={ ( value ) =>
					setAttributes( { content: value } )
				}
				onMerge={ mergeBlocks }
				onSplit={ ( value ) => {
					if ( ! content?.length ) {
						return createBlock( blockNameFallback );
					}

					if ( ! value ) {
						return createBlock( blockName );
					}

					return createBlock( blockName, {
						...attributes,
						content: value,
					} );
				} }
				onReplace={ onReplace }
				onRemove={
					onReplace ? () => onReplace( [] ) : undefined
				}
				placeholder={ placeholder || __( 'Write dialogue…', 'jetpack' ) }
				keepPlaceholderOnFocus={ true }
				isSelected={ ! isFocusedOnParticipantLabel }
				onFocus={ () => setIsFocusedOnParticipantLabel( false ) }
			/>
		</div>
	);
}

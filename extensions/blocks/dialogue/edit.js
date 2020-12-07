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

import {
	Button,
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
import ParticipantsDropdown from './components/participants-control';
import TimeStampControl from './components/time-stamp-control';
import ConversationContext from '../conversation/components/context';
import { defaultParticipants, defaultParticipantSlug } from '../conversation/edit';
import { formatUppercase } from '../../shared/icons';

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
		timeStamp,
		content,
		placeholder,
	} = attributes;
	const [ isFocusedOnParticipantLabel, setIsFocusedOnParticipantLabel ] = useState( false );

	// Block context integration.
	const participantsFromContext = context[ 'jetpack/conversation-participants' ];
	const showTimeStamp = context[ 'jetpack/conversation-showtimestamp' ];

	// Participants list.
	const participants = participantsFromContext?.length ? participantsFromContext : defaultParticipants;

	// Participant object.
	const isCustomParticipant = !! participant && ! participantSlug;
	const currentParticipantSlug = ! participant && ! participantSlug ? defaultParticipantSlug : participantSlug;
	const currentParticipant = getParticipantBySlug( participants, currentParticipantSlug );
	const participantLabel = isCustomParticipant ? participant : currentParticipant?.participant;

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

	return (
		<div className={ className }>
			<BlockControls>
				<ToolbarGroup>
					<ParticipantsDropdown
						id={ `dialogue-${ instanceId }-participants-dropdown` }
						className={ baseClassName }
						participants={ participants }
						participant={ participant }
						label={ participantLabel }
						onSelect={ ( { newParticipantSlug } ) => {
							setAttributes( {
								participantSlug: newParticipantSlug,
							} );
						} }
						onChange={ ( { newParticipant } ) => setAttributes( {
							participantSlug: null,
							participant: newParticipant,
						} ) }
					/>
				</ToolbarGroup>

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
					<PanelBody title={ __( 'Time stamp', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Show', 'jetpack' ) }
							checked={ showTimeStamp }
							onChange={
								( show ) => transcritionBridge.setAttributes( { showTimeStamp: show } )
							}
						/>

						{ showTimeStamp && (
							<TimeStampControl
								className={ `${ baseClassName }__timestamp-control` }
								value={ timeStamp }
								onChange={ ( newTimeStampValue ) => {
									setAttributes( { timeStamp: newTimeStampValue } );
								} }
							/>
						) }
					</PanelBody>
				</Panel>
			</InspectorControls>

			<div class={ `${ baseClassName }__meta` }>
				<Button
					className={ getParticipantLabelClass() }
					onFocus={ () => setIsFocusedOnParticipantLabel( true ) }
				>
					{ participantLabel }
				</Button>

				{ showTimeStamp && (
					<div className={ `${ baseClassName }__timestamp` }>
						{ timeStamp }
					</div>
				) }
			</div>

			<RichText
				identifier="content"
				wrapperClassName={ `${ baseClassName }__content` }
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

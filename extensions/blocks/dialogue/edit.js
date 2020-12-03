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
import SpeakersDropdown from './components/speakers-control';
import TimeStampControl from './components/time-stamp-control';
import TranscriptionContext from '../transcription/components/context';
import { defaultSpeakers, defaultSpeakerSlug } from '../transcription/edit';
import { formatUppercase } from '../../shared/icons';

function getSpeakerBySlug( speakers, slug ) {
	const speaker = find( speakers, ( contextSpeaker ) => contextSpeaker.speakerSlug === slug );
	if ( speaker ) {
		return speaker;
	}

	// Fallback speaker. First one in the list.
	return speakers?.[ 0 ];
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
		speaker,
		speakerSlug,
		timeStamp,
		content,
		placeholder,
	} = attributes;
	const [ isFocusedOnSpeakerLabel, setIsFocusedOnSpeakerLabel ] = useState( false );

	// Block context integration.
	const speakersFromContext = context[ 'jetpack/conversation-speakers' ];
	const showTimeStamp = context[ 'jetpack/transcription-showtimestamp' ];

	// Speakers list.
	const speakers = speakersFromContext?.length ? speakersFromContext : defaultSpeakers;

	// Speaker object.
	const isCustomSpeaker = !! speaker && ! speakerSlug;
	const currentSpeakerSlug = ! speaker && ! speakerSlug ? defaultSpeakerSlug : speakerSlug;
	const currentSpeaker = getSpeakerBySlug( speakers, currentSpeakerSlug );
	const speakerLabel = isCustomSpeaker ? speaker : currentSpeaker?.speaker;

	// Transcription context. A bridge between dialogue and transcription blocks.
	const transcritionBridge = useContext( TranscriptionContext );

	const baseClassName = 'wp-block-jetpack-dialogue';

	return (
		<div className={ className }>
			<BlockControls>
				<ToolbarGroup>
					<SpeakersDropdown
						id={ `dialogue-${ instanceId }-speakers-dropdown` }
						className={ baseClassName }
						speakers={ speakers }
						speaker={ speaker }
						label={ speakerLabel }
						onSelect={ ( { newSpeakerSlug } ) => {
							setAttributes( {
								speakerSlug: newSpeakerSlug,
							} );
						} }
						onChange={ ( { newSpeaker } ) => setAttributes( {
							speakerSlug: null,
							speaker: newSpeaker,
						} ) }
					/>
				</ToolbarGroup>

				{ currentSpeaker && isFocusedOnSpeakerLabel && (
					<ToolbarGroup>
						<ToolbarButton
							icon="editor-bold"
							isPressed={ currentSpeaker.hasBoldStyle }
							onClick={ () => transcritionBridge.updateSpeakers(
								{
									speakerSlug: currentSpeakerSlug,
									hasBoldStyle: ! currentSpeaker.hasBoldStyle,
								}
							) }
						/>

						<ToolbarButton
							icon="editor-italic"
							isPressed={ currentSpeaker.hasItalicStyle }
							onClick={ () => transcritionBridge.updateSpeakers(
								{
									speakerSlug: currentSpeakerSlug,
									hasItalicStyle: ! currentSpeaker.hasItalicStyle,
								}
							) }
						/>

						<ToolbarButton
							icon={ formatUppercase }
							isPressed={ currentSpeaker.hasUppercaseStyle }
							onClick={ () => transcritionBridge.updateSpeakers(
								{
									speakerSlug: currentSpeakerSlug,
									hasUppercaseStyle: ! currentSpeaker.hasUppercaseStyle,
								}
							) }
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
					className={ classnames( `${ baseClassName }__speaker`, {
						[ 'has-bold-style' ]: currentSpeaker?.hasBoldStyle,
						[ 'has-italic-style' ]: currentSpeaker?.hasItalicStyle,
						[ 'has-uppercase-style' ]: currentSpeaker?.hasUppercaseStyle,
					} ) }
					onFocus={ () => setIsFocusedOnSpeakerLabel( true ) }
				>
					{ speakerLabel }
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
				isSelected={ ! isFocusedOnSpeakerLabel }
				onFocus={ () => setIsFocusedOnSpeakerLabel( false ) }
			/>
		</div>
	);
}

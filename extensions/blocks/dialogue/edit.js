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
	InnerBlocks,
	BlockControls,
} from '@wordpress/block-editor';

import {
	Panel,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
	TextControl,
	ToolbarButton,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import { formatUppercase } from '../../shared/icons';
import 	SpeakersDropdown from './components/speakers-control';
import TimeStampControl from './components/time-stamp-control';
import TranscriptionContext from '../transcription/components/context';

const defaultSpeakers = [
	{
		speakerSlug: 'speaker-0',
		speaker: __( 'First', 'jetpack' ),
	},
	{
		speakerSlug: 'speaker-1',
		speaker: __( 'Second', 'jetpack' ),
	},
	{
		speakerSlug: 'speaker-2',
		speaker: __( 'Third', 'jetpack' ),
	},
];

function getSpeakerBySlug( speakers, slug ) {
	return find( speakers, ( contextSpeaker ) => contextSpeaker.speakerSlug === slug );
}

export default function DialogueEdit ( {
	className,
	attributes,
	setAttributes,
	instanceId,
	context,
} ) {
	const {
		speaker,
		speakerSlug,
		timeStamp,
	} = attributes;

	// Block context integration.
	const speakersFromContext = context[ 'jetpack/conversation-speakers' ];
	const showTimeStamp = context[ 'jetpack/transcription-showtimestamp' ];

	// Speakers list.
	const speakers = speakersFromContext?.length ? speakersFromContext : defaultSpeakers;

	// speaker object.
	const isCustomSpeaker = !! speaker && ! speakerSlug;
	const currentSpeakerSlug = ! speaker && ! speakerSlug ? 'speaker-0' : speakerSlug;
	const currentSpeaker = getSpeakerBySlug( speakers, currentSpeakerSlug );
	const speakerName = currentSpeaker?.speaker || speaker;

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
						speakerName={ speakerName }
						onSelect={ ( { newSpeakerSlug } ) => {
							setAttributes( {
								speakerSlug: newSpeakerSlug,
							} );
						} }
						onChange={ ( { editSpeakerSlug, editSpeaker } ) => {
							transcritionBridge.updateSpeakerBySlug(
								editSpeakerSlug,
								{
									speaker: editSpeaker,
								}
							);
						 } }
						onCustomChange={ ( { newSpeaker } ) => setAttributes( {
							speakerSlug: null,
							speaker: newSpeaker,
						} ) }
					/>
				</ToolbarGroup>
				{ currentSpeaker && (
					<ToolbarGroup>
						<ToolbarButton
							icon="editor-bold"
							isPressed={ currentSpeaker.hasBoldStyle }
							onClick={ () => transcritionBridge.updateSpeakerBySlug(
								currentSpeakerSlug,
								{
									hasBoldStyle: ! currentSpeaker.hasBoldStyle,
								}
							) }
						/>

						<ToolbarButton
							icon="editor-italic"
							isPressed={ currentSpeaker.hasItalicStyle }
							onClick={ () => transcritionBridge.updateSpeakerBySlug(
								currentSpeakerSlug,
								{
									hasItalicStyle: ! currentSpeaker.hasItalicStyle,
								}
							) }
						/>

						<ToolbarButton
							icon={ formatUppercase }
							isPressed={ currentSpeaker.hasUppercaseStyle }
							onClick={ () => transcritionBridge.updateSpeakerBySlug(
								currentSpeakerSlug,
								{
									hasUppercaseStyle: ! currentSpeaker.hasUppercaseStyle,
								}
							) }
						/>
					</ToolbarGroup>
				) }
			</BlockControls>

			<InspectorControls>
				<Panel>
					<PanelBody title={ isCustomSpeaker ? __( 'Custom speaker', 'jetpack' ) : __( 'Speaker', 'jetpack' ) }>
						{ currentSpeaker && (
							<TextControl
								value={ currentSpeaker.speaker }
								onChange={ ( speakerEditedValue ) => transcritionBridge.updateSpeakerBySlug(
									currentSpeakerSlug,
									{
										speaker: speakerEditedValue,
									}
								) }
							/>
						) }

						{ isCustomSpeaker && (
							<TextControl
								value={ speaker }
								onChange={ ( { editedSpeaker } ) => setAttributes( {
									speaker: editedSpeaker,
								} ) }
							/>
						) }
					</PanelBody>

					<PanelBody title={ __( 'Timestamp', 'jetpack' ) }>
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
				<div
					className={ classnames( `${ baseClassName }__speaker`, {
						[ 'has-bold-style' ]: currentSpeaker?.hasBoldStyle,
						[ 'has-italic-style' ]: currentSpeaker?.hasItalicStyle,
						[ 'has-uppercase-style' ]: currentSpeaker?.hasUppercaseStyle,
					} ) }
				>
					{ speakerName }
				</div>

				{ showTimeStamp && (
					<div className={ `${ baseClassName }__timestamp` }>
						{ timeStamp }
					</div>
				) }
			</div>

			<InnerBlocks
				template={ [ [ 'core/paragraph', { placeholder: __( 'speaker says…', 'jetpack' ) } ] ] }
				templateLock="all"
			/>
		</div>
	);
}

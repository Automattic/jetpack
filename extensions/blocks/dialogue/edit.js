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
} from '@wordpress/components';
import { useEffect, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import SpeakersDropdown from './components/speakers-dropdown';
import TimeStampControl from './components/time-stamp-control';
import TranscriptionContext from '../transcription/components/context';

const defaultSpeakers = [
	{
		speakerSlug: 'speaker-0',
		speaker: __( 'First', 'jetpack' ),
		placeholder: __( 'speaker says…', 'Jetpack' ),
	},
	{
		speakerSlug: 'speaker-1',
		speaker: __( 'Second', 'jetpack' ),
		placeholder: __( 'speaker says…', 'Jetpack' ),
	},
	{
		speakerSlug: 'speaker-2',
		speaker: __( 'Third', 'jetpack' ),
		placeholder: __( 'speaker says…', 'Jetpack' ),
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
		color,
		backgroundColor,
		timeStamp,
		placeholder = defaultSpeakers[ 0 ].placeholder,
		className: classNameAttr,
	} = attributes;

	// Block context integration.
	const speakersFromContext = context[ 'jetpack/conversation-speakers' ];
	const showTimeStamp = context[ 'jetpack/transcription-showtimestamp' ];
	const contextDialogueStyle = context[ 'jetpack/conversation-style' ];

	// Speakers list.
	const speakers = speakersFromContext?.length ? speakersFromContext : defaultSpeakers;

	// speaker object.
	const currentSpeaker = getSpeakerBySlug( speakers, speakerSlug );
	const speakerName = currentSpeaker?.speaker || speaker;

	// Transcription context. A bridge between dialogue and transcription blocks.
	const transcritionBridge = useContext( TranscriptionContext );

	useEffect( () => {
		if ( ! transcritionBridge?.setAttributes ) {
			return;
		}
		transcritionBridge.setAttributes( { dialogueStyle: classNameAttr } );
	}, [ classNameAttr, transcritionBridge ] );

	useEffect( () => {
		if ( ! contextDialogueStyle ) {
			return;
		}

		setAttributes( { className: contextDialogueStyle } );
	}, [ contextDialogueStyle, setAttributes ] );

	const baseClassName = 'wp-block-jetpack-dialogue';

	return (
		<div class={ className }>
			<BlockControls>
				<ToolbarGroup>
					<SpeakersDropdown
						id={ `dialogue-${ instanceId }-speakers-dropdown` }
						speakers={ speakers }
						speaker={ speaker }
						speakerSlug={ speakerSlug }
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
			</BlockControls>

			<InspectorControls>
				<Panel>
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
						[ 'has-background-color' ]: !! backgroundColor,
					} ) }
					style={ { color, backgroundColor } }
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
				template={ [ [ 'core/paragraph', { placeholder } ] ] }
				templateLock="all"
			/>
		</div>
	);
}

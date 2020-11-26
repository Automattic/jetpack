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
	} = attributes;

	// Block context integration.
	const speakersFromContext = context[ 'dialogue/speakers' ];
	const showTimeStamp = context[ 'dialogue/showTimeStamp' ];

	// Speakers list.
	const speakers = speakersFromContext?.length ? speakersFromContext : defaultSpeakers;

	// Transcription context. A bridge between dialogue and transcription blocks.
	const transcritionBridge = useContext( TranscriptionContext );

	useEffect( () => {
		if ( ! speaker ) {
			// set the initial value for the speaker.
			return setAttributes( speakers[ 0 ] );
		}

		// Follow labels changes when block context changes.
		if ( ! speakersFromContext ) {
			return;
		}

		const speakerBySlugObject = find( speakersFromContext, ( contextSpeaker ) => contextSpeaker.speakerSlug === speakerSlug );
		if ( ! speakerBySlugObject ) {
			return;
		}

		setAttributes( {
			color: null,
			backgroundColor: null,
			...speakerBySlugObject,
		} );
	}, [ speakerSlug, speakersFromContext, setAttributes, speaker, speakers ] );

	const baseClassName = 'wp-block-jetpack-dialogue';

	return (
		<div class={ className }>
			<BlockControls>
				<ToolbarGroup>
					<SpeakersDropdown
						id={ `dialogue-${ instanceId }-speakers-dropdown` }
						speakers={ speakers }
						speaker={ speaker }
						onSelect={ ( { newSpeaker, newSpeakerSlug } ) => {
							setAttributes( {
								speakerSlug: newSpeakerSlug,
								speaker: newSpeaker,
							} );
						} }
						onChange={ ( { newSpeaker, newSpeakerSlug } ) => setAttributes( {
							speakerSlug: newSpeakerSlug,
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
					{ speaker }
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

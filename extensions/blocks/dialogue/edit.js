/**
 * External dependencies
 */
import { find } from 'lodash';

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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import SpeakersDropdown from './components/speakers-dropdown';
import TimeStampControl from './components/time-stamp-control';

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
		showTimeStamp,
		timeStamp,
		placeholder = defaultSpeakers[ 0 ].placeholder,
	} = attributes;

	// Block context integration.
	const speakersFromContext = context[ 'dialogue/speakers' ];

	// Follow lables changes when block context changes.
	useEffect( () => {
		if ( ! speakersFromContext ) {
			return;
		}

		const speakerBySlugObject = find( speakersFromContext, ( contextSpeaker ) => contextSpeaker.speakerSlug === speakerSlug );
		if ( ! speakerBySlugObject ) {
			return;
		}

		setAttributes( speakerBySlugObject );
	}, [ speakerSlug, speakersFromContext, setAttributes ] );

	const speakers = speakersFromContext?.length ? speakersFromContext : defaultSpeakers;

	const speakerBySlug = find( speakers, ( speakerOption ) => speakerOption.speakerSlug === speakerSlug );
	const defaultSpeakerObject = speakerSlug && speakerBySlug ? speakerBySlug : speakers[ 0 ];
	const isCustomSpeaker = ! speakerSlug && speaker;
	const currentSpeaker = isCustomSpeaker ? speaker : defaultSpeakerObject.speaker;

	return (
		<div class={ className }>
			<BlockControls>
				<ToolbarGroup>
					<SpeakersDropdown
						id={ `dialogue-${ instanceId }-speakers-dropdown` }
						speakers={ speakers }
						speaker={ currentSpeaker }
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
								( show ) => setAttributes( { showTimeStamp: show } )
							}
						/>

						{ showTimeStamp && (
							<TimeStampControl
								className={ `${ className }__timestamp-control` }
								value={ timeStamp }
								onChange={ ( newTimeStampValue ) => {
									setAttributes( { timeStamp: newTimeStampValue } );
								} }
							/>
						) }
					</PanelBody>
				</Panel>
			</InspectorControls>

			<div class={ `${ className }__meta` }>
				<div
					className={ `${ className }__speaker` }
					style={ { color, backgroundColor } }
				>
					{ currentSpeaker }
				</div>

				{ showTimeStamp && (
					<div className={ `${ className }__timestamp` }>
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

/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, InnerBlocks } from '@wordpress/block-editor';
import {
	Panel,
	PanelBody,
	ToggleControl,
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
		placeholder: __( 'First speaker says…', 'Jetpack' ),
	},
	{
		speakerSlug: 'speaker-1',
		speaker: __( 'Second', 'jetpack' ),
		placeholder: __( 'Second speaker says…', 'Jetpack' ),
	},
	{
		speakerSlug: 'speaker-2',
		speaker: __( 'Third', 'jetpack' ),
		placeholder: __( 'Third speaker says…', 'Jetpack' ),
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

	return (
		<div class={ className }>
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
				<SpeakersDropdown
					id={ `dialogue-${ instanceId }-speakers-selector` }
					className={ className }
					speakers={ speakers }
					speaker={ speaker }
					slug={ speakerSlug }
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

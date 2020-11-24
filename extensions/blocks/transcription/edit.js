/* global MediaElementPlayer, mejs */

/**
 * External dependencies
 */
import { filter, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useEffect,
	useState,
	useRef,
	useMemo,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import {
	Panel,
	PanelBody,
	TextControl,
	BaseControl,
	Button,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import TranscritptionContext from './components/context';

const defaultLabels = [
	{
		speakerSlug: 'speaker-0',
		speaker: __( 'Speaker one', 'jetpack' ),
		textColor: '#fff',
		bgColor: '#046',
	},
	{
		speakerSlug: 'speaker-1',
		speaker: __( 'Speaker two', 'jetpack' ),
		textColor: '#fff',
		bgColor: '#084',
	},
	{
		speakerSlug: 'speaker-2',
		speaker: __( 'Speaker tree', 'jetpack' ),
		textColor: '#fff',
		bgColor: '#804',
	},
];

const TRANSCRIPTION_TEMPLATE = [
	[ 'core/heading', { placeholder: __( 'Transcription title', 'Jetpack' ) } ],
	[ 'jetpack/podcast-player' ],
	[ 'jetpack/dialogue', { placeholder: __( 'logging…', 'Jetpack' ) } ],
	[ 'jetpack/dialogue', { placeholder: __( 'logging…', 'Jetpack' ) } ],
	[ 'jetpack/dialogue', { placeholder: __( 'logging…', 'Jetpack' ) } ],
];

export default function Transcription ( {
	className,
	attributes,
	setAttributes,
} ) {
	const { speakers, showTimeStamp } = attributes;
	const [ newLabelValue, setNewLabelValue ] = useState();

	const containertRef = useRef();

	// Set initial transcription speakers.
	useEffect( () => {
		if ( speakers ) {
			return;
		}

		setAttributes( { speakers: defaultLabels } );
	}, [ speakers, setAttributes ] );

	function pickMediaData() {
		if ( ! containertRef?.current ) {
			return;
		}

		const { current: wrapperElement } = containertRef;
		if ( ! wrapperElement ) {
			return;
		}

		const mediaAudio = wrapperElement.querySelector( '.mejs-container audio' );
		if ( ! mediaAudio ) {
			return;
		}

		return {
			mediaAudio,
			timeCodeToSeconds: mejs.Utils.timeCodeToSeconds,
		};
	}

	function updateLabels ( updatedSpeaker ) {
		const newLabels = map( speakers, ( speaker ) => {
			if ( speaker.speakerSlug !== updatedSpeaker.speakerSlug ) {
				return speaker;
			}
			return {
				...speaker,
				...updatedSpeaker,
			};
		} );

		setAttributes( { speakers: newLabels } );
	}

	function deleteSpeaker( deletedSpeakerSlug ) {
		setAttributes( { speakers: filter( speakers, ( { speakerSlug } ) => ( speakerSlug !== deletedSpeakerSlug ) ) } );
	}

	function addNewLabel () {
		setAttributes( {
			speakers: [
				...speakers,
				{
					speaker: newLabelValue,
					speakerSlug: `speakerSlug-${ speakers?.length ? speakers?.length : 0 }`,
				},
			],
		} );

		setNewLabelValue( '' );
	}

	return (
		<TranscritptionContext.Provider value={ useMemo( () => pickMediaData, [] ) }>
			<div
				ref={ containertRef }
				class={ className }
			>
				<InspectorControls>
					<Panel>
						<PanelBody title={ __( 'speakers', 'jetpack' ) } className={ `${ className }__speakers` }>
							{ map( speakers, ( { value, speakerSlug, textColor, bgColor } ) => (
								<BaseControl className={ `${ className }__speaker-control` }>
									<div className={ `${ className }__speaker` }>
										<TextControl
											value={ value }
											onChange={ ( speakerEditedValue ) => updateLabels( { speakerSlug, speaker: speakerEditedValue } ) }
										/>

										<Button
											label={ __( 'Delete', 'jetpack' ) }
											onClick={ () => deleteSpeaker( speakerSlug ) }
											isSecondary
											isSmall
										>
											{ __( 'Delete', 'jetpack' ) }
										</Button>
									</div>

									<PanelColorSettings
										title={ __( 'Color Settings', 'jetpack' ) }
										colorSettings={ [
											{
												speaker: textColor,
												onChange: ( newTextColor ) => updateLabels( { speakerSlug, textColor: newTextColor } ),
												label: __( 'Text Color', 'jetpack' ),
											},
											{
												speaker: bgColor,
												onChange: ( newBGColor ) => updateLabels( { speakerSlug, bgColor: newBGColor } ),
												label: __( 'Background Color', 'jetpack' ),
											},
										] }
										initialOpen={ false }
									/>
								</BaseControl>
							) ) }

							<BaseControl>
								<div className={ `${ className }__speakerl` }>
									<TextControl
										label={ __( 'Add a new speaker', 'jetpack' ) }
										value={ newLabelValue }
										onChange={ setNewLabelValue }
										onKeyDown={ ( { key } ) => {
											if ( key !== 'Enter' ) {
												return;
											}

											addNewLabel();
										} }
									/>

									<Button
										className={ `${ className }__add-button` }
										label={ __( 'Add', 'jetpack' ) }
										onClick={ addNewLabel }
										isSecondary
										isSmall
									>
										{ __( 'Add', 'jetpack' ) }
									</Button>
								</div>
							</BaseControl>
						</PanelBody>

						<PanelBody title={ __( 'Time stamps', 'jetpack' ) } className={ `${ className }__timestamps` }>
							<ToggleControl
								label={ __( 'Show time stamps', 'jetpack' ) }
								checked={ showTimeStamp }
								onChange={ ( value ) => setAttributes( { showTimeStamp: value } ) }
							/>
						</PanelBody>
					</Panel>
				</InspectorControls>
				<InnerBlocks
					template={ TRANSCRIPTION_TEMPLATE }
				/>
			</div>
		</TranscritptionContext.Provider>
	);
}

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

const TRANSCRIPTION_TEMPLATE = [
	[ 'core/heading', { placeholder: __( 'Transcription title', 'Jetpack' ) } ],
	[ 'jetpack/podcast-player' ],
	[ 'jetpack/dialogue', defaultLabels[ 0 ] ],
	[ 'jetpack/dialogue', defaultLabels[ 1 ] ],
	[ 'jetpack/dialogue', defaultLabels[ 2 ] ],
];

function TranscriptionEdit ( {
	className,
	attributes,
	setAttributes,
} ) {
	const { speakers, showTimeStamp, dialogueStyle } = attributes;
	const [ newLabelValue, setNewLabelValue ] = useState();
	const containertRef = useRef();

	// Set initial transcription speakers.
	useEffect( () => {
		if ( speakers ) {
			return;
		}

		setAttributes( { speakers: defaultLabels } );
	}, [ speakers, setAttributes ] );

	// Context bridge.
	const contextProvision = {
		setAttributes: useMemo( () => setAttributes, [ setAttributes ] ),

		attributes: {
			showTimeStamp,
			dialogueStyle,
		},
	};

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
					speakerSlug: `speaker-${ speakers?.length ? speakers?.length : 0 }`,
				},
			],
		} );

		setNewLabelValue( '' );
	}

	return (
		<TranscritptionContext.Provider value={ contextProvision }>
			<div ref={ containertRef } class={ className }>
				<InspectorControls>
					<Panel>
						<PanelBody title={ __( 'speakers', 'jetpack' ) } className={ `${ className }__speakers` }>
							{ map( speakers, ( { speaker, speakerSlug, color, backgroundColor } ) => (
								<BaseControl className={ `${ className }__speaker-control` }>
									<div className={ `${ className }__speaker` }>
										<TextControl
											value={ speaker }
											onChange={ ( speakerEditedValue ) => updateLabels( {
												speakerSlug,
												speaker: speakerEditedValue,
												placeholder: `${ speaker } says…`,
											} ) }
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
												value: color,
												onChange: ( newTextColor ) => {
													updateLabels( { speakerSlug, color: newTextColor } );
												},
												label: __( 'Text Color', 'jetpack' ),
											},
											{
												value: backgroundColor,
												onChange: ( newBGColor ) => updateLabels( { speakerSlug, backgroundColor: newBGColor } ),
												label: __( 'Background Color', 'jetpack' ),
											},
										] }
										initialOpen={ false }
									/>
								</BaseControl>
							) ) }

							<BaseControl>
								<div className={ `${ className }__speaker` }>
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

						<PanelBody title={ __( 'Timestamps', 'jetpack' ) } className={ `${ className }__timestamps` }>
							<ToggleControl
								label={ __( 'Show dialogue timestamps', 'jetpack' ) }
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

export default TranscriptionEdit;

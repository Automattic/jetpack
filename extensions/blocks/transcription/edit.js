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
	useCallback,
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
	const { speakers, showTimeStamp, className: classNameAttr } = attributes;
	const [ newLabelValue, setNewLabelValue ] = useState();
	const containertRef = useRef();

	// Set initial transcription speakers.
	useEffect( () => {
		if ( speakers ) {
			return;
		}

		setAttributes( { speakers: defaultLabels } );
	}, [ speakers, setAttributes ] );

	const updateSpeakers = useCallback( ( updatedSpeaker ) => (
		setAttributes( { speakers: map( speakers, ( speaker ) => {
			if ( speaker.speakerSlug !== updatedSpeaker.speakerSlug ) {
				return speaker;
			}
			return {
				...speaker,
				...updatedSpeaker,
			};
		} ) } )
	), [ setAttributes, speakers ] );

	const updateSpeakerBySlug = useCallback( ( slug, data ) => updateSpeakers( {
		speakerSlug: slug,
		...data,
	} ), [ updateSpeakers ] );

	// Context bridge.
	const contextProvision = {
		setAttributes: useMemo( () => setAttributes, [ setAttributes ] ),
		updateSpeakerBySlug,

		attributes: {
			showTimeStamp,
			classNameAttr,
		},
	};

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

	const baseClassName = 'wp-block-jetpack-transcription';

	return (
		<TranscritptionContext.Provider value={ contextProvision }>
			<div ref={ containertRef } className={ className }>
				<InspectorControls>
					<Panel>
						<PanelBody title={ __( 'Speakers', 'jetpack' ) } className={ `${ baseClassName }__speakers` }>
							{ map( speakers, ( { speaker, speakerSlug, color, backgroundColor } ) => (
								<BaseControl className={ `${ baseClassName }__speaker-control` }>
									<div className={ `${ baseClassName }__speaker` }>
										<TextControl
											value={ speaker }
											onChange={ ( speakerEditedValue ) => updateSpeakers( {
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
													updateSpeakers( { speakerSlug, color: newTextColor } );
												},
												label: __( 'Text Color', 'jetpack' ),
											},
											{
												value: backgroundColor,
												onChange: ( newBGColor ) => updateSpeakers( { speakerSlug, backgroundColor: newBGColor } ),
												label: __( 'Background Color', 'jetpack' ),
											},
										] }
										initialOpen={ false }
									/>
								</BaseControl>
							) ) }

							<BaseControl>
								<div className={ `${ baseClassName }__speaker` }>
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
										className={ `${ baseClassName }__add-button` }
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

						<PanelBody title={ __( 'Timestamps', 'jetpack' ) } className={ `${ baseClassName }__timestamps` }>
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

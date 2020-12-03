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
	useRef,
	useCallback,
	useMemo,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import {
	Panel,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import SpeakersDropdown, {
	AddSpeakerButton,
	SpeakersLabelControl,
	SpeakersSettingsControl,
} from './components/speakers-controls';
import TranscritptionContext from './components/context';

export const defaultSpeakersSlug = 'speaker-0';
export const defaultSpeakers = [
	{
		speakerSlug: 'speaker-0',
		speaker: __( 'Participant 1', 'jetpack' ),
	},
	{
		speakerSlug: 'speaker-1',
		speaker: __( 'Participant 2', 'jetpack' ),
	},
	{
		speakerSlug: 'speaker-2',
		speaker: __( 'Participant 3', 'jetpack' ),
	},
];

const TRANSCRIPTION_TEMPLATE = [
	[ 'core/heading', { placeholder: __( 'Transcription title', 'Jetpack' ) } ],
	[ 'jetpack/podcast-player' ],
	[ 'jetpack/dialogue', defaultSpeakers[ 0 ] ],
	[ 'jetpack/dialogue', defaultSpeakers[ 1 ] ],
	[ 'jetpack/dialogue', defaultSpeakers[ 2 ] ],
];

function TranscriptionEdit ( {
	className,
	attributes,
	setAttributes,
} ) {
	const { speakers, showTimeStamp, className: classNameAttr } = attributes;
	const containertRef = useRef();

	// Set initial transcription speakers.
	useEffect( () => {
		if ( speakers ) {
			return;
		}

		setAttributes( { speakers: defaultSpeakers } );
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

	// Context bridge.
	const contextProvision = {
		setAttributes: useMemo( () => setAttributes, [ setAttributes ] ),
		updateSpeakers,

		attributes: {
			showTimeStamp,
			classNameAttr,
		},
	};

	function deleteSpeaker( deletedSpeakerSlug ) {
		setAttributes( { speakers: filter( speakers, ( { speakerSlug } ) => ( speakerSlug !== deletedSpeakerSlug ) ) } );
	}

	function addNewSpeaker( newSpakerValue ) {
		setAttributes( {
			speakers: [
				...speakers,
				{
					speaker: newSpakerValue,
					speakerSlug: `speaker-${ speakers?.length ? speakers?.length : 0 }`,
				},
			],
		} );
	}

	const baseClassName = 'wp-block-jetpack-transcription';

	return (
		<TranscritptionContext.Provider value={ contextProvision }>
			<div ref={ containertRef } className={ className }>
				<BlockControls>
					<ToolbarGroup>
						<SpeakersDropdown
							className={ baseClassName }
							speakers={ speakers }
							label={ __( 'Participants', 'jetpack' ) }
							onChange={ updateSpeakers }
							onDelete={ deleteSpeaker }
							onAdd={ addNewSpeaker }
						/>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<Panel>
						<PanelBody title={ __( 'Participants labels', 'jetpack' ) } className={ `${ baseClassName }__speakers` }>
							<SpeakersLabelControl
								className={ baseClassName }
								speakers={ speakers }
								onChange={ updateSpeakers }
								onDelete={ deleteSpeaker }
							/>

							<AddSpeakerButton
								className={ baseClassName }
								onAdd={ addNewSpeaker }
							/>
						</PanelBody>

						<PanelBody title={ __( 'Participants settings', 'jetpack' ) } className={ `${ baseClassName }__speakers` }>
							<SpeakersSettingsControl
								className={ baseClassName }
								speakers={ speakers }
								onSet={ updateSpeakers }
							/>
						</PanelBody>

						<PanelBody title={ __( 'Time stamps', 'context' ) } className={ `${ baseClassName }__timestamps` }>
							<ToggleControl
								label={ __( 'Show time 	stamps', 'jetpack' ) }
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

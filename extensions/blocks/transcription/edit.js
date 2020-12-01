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
	BlockControls,
} from '@wordpress/block-editor';
import {
	Panel,
	PanelBody,
	TextControl,
	BaseControl,
	Button,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import SpeakersDropdown, {
	AddSpeakerButton,
	SpeakersControl,
} from './components/speakers-dropdown';
import TranscritptionContext from './components/context';

const defaultLabels = [
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
							label={ __( 'Speakers', 'jetpack' ) }
							onChange={ updateSpeakers }
							onDelete={ deleteSpeaker }
							onAdd={ addNewSpeaker }
						/>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<Panel>
						<PanelBody title={ __( 'Participants labels', 'jetpack' ) } className={ `${ baseClassName }__speakers` }>
							<SpeakersControl
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

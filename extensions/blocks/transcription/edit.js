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
		slug: 'speaker-0',
		value: __( 'Speaker one', 'jetpack' ),
		textColor: '#fff',
		bgColor: '#046',
	},
	{
		slug: 'speaker-1',
		value: __( 'Speaker two', 'jetpack' ),
		textColor: '#fff',
		bgColor: '#084',
	},
	{
		slug: 'speaker-2',
		value: __( 'Speaker tree', 'jetpack' ),
		textColor: '#fff',
		bgColor: '#804',
	},
];

const TRANSCRIPTION_TEMPLATE = [
	[ 'core/heading', { placeholder: __( 'Transcription title', 'Jetpack' ) } ],
	[ 'jetpack/podcast-player' ],
	[ 'jetpack/changelog', { placeholder: __( 'logging…', 'Jetpack' ) } ],
	[ 'jetpack/changelog', { placeholder: __( 'logging…', 'Jetpack' ) } ],
	[ 'jetpack/changelog', { placeholder: __( 'logging…', 'Jetpack' ) } ],
];

export default function Transcription ( {
	className,
	attributes,
	setAttributes,
} ) {
	const { labels, showTimeStamp } = attributes;
	const [ newLabelValue, setNewLabelValue ] = useState();

	const containertRef = useRef();

	// Set initial transcription labels.
	useEffect( () => {
		if ( labels ) {
			return;
		}

		setAttributes( { labels: defaultLabels } );
	}, [ labels, setAttributes ] );

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

	function updateLabels ( updatedLabel ) {
		const newLabels = map( labels, ( label ) => {
			if ( label.slug !== updatedLabel.slug ) {
				return label;
			}
			return {
				...label,
				...updatedLabel,
			};
		} );

		setAttributes( { labels: newLabels } );
	}

	function deleteLabel( labelSlug ) {
		setAttributes( { labels: filter( labels, ( { slug } ) => ( slug !== labelSlug ) ) } );
	}

	function addNewLabel () {
		setAttributes( {
			labels: [
				...labels,
				{
					value: newLabelValue,
					slug: `slug-${ labels?.length ? labels?.length : 0 }`,
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
						<PanelBody title={ __( 'labels', 'jetpack' ) } className={ `${ className }__labels` }>
							{ map( labels, ( { value, slug, textColor, bgColor } ) => (
								<BaseControl className={ `${ className }__label-control` }>
									<div className={ `${ className }__label` }>
										<TextControl
											value={ value }
											onChange={ ( labelEditedValue ) => updateLabels( { slug, value: labelEditedValue } ) }
										/>

										<Button
											label={ __( 'Delete', 'jetpack' ) }
											onClick={ () => deleteLabel( slug ) }
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
												value: textColor,
												onChange: ( newTextColor ) => updateLabels( { slug, textColor: newTextColor } ),
												label: __( 'Text Color', 'jetpack' ),
											},
											{
												value: bgColor,
												onChange: ( newBGColor ) => updateLabels( { slug, bgColor: newBGColor } ),
												label: __( 'Background Color', 'jetpack' ),
											},
										] }
										initialOpen={ false }
									/>
								</BaseControl>
							) ) }

							<BaseControl>
								<div className={ `${ className }__label` }>
									<TextControl
										label={ __( 'Add a new label', 'jetpack' ) }
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

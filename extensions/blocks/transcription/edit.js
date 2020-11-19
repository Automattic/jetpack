/* global MediaElementPlayer */

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
	useReducer,
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
import { TranscritptionContext } from './components';

const defaultLabels = [
	{
		slug: 'label-0',
		value: __( 'Speaker one', 'jetpack' ),
		textColor: '#fff',
		bgColor: '#046',
	},
	{
		slug: 'label-1',
		value: __( 'Speaker two', 'jetpack' ),
		textColor: '#fff',
		bgColor: '#084',
	},
	{
		slug: 'label-2',
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

const TRANSCRIPTION_ALLOWED_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'jetpack/podcast-player',
	'jetpack/changelog',
];

export default function Transcription ( {
	className,
	attributes,
	setAttributes,
} ) {
	const { labels, showTimeStamp } = attributes;
	const [ newLabelValue, setNewLabelValue ] = useState();

	const containertRef = useRef();
	const playerRef = useRef();

	// Set initial transcription labels.
	useEffect( () => {
		if ( labels ) {
			return;
		}

		setAttributes( { labels: defaultLabels } );
	}, [ labels, setAttributes ] );

	// Try to pick up the podcast player
	const [ attempToPickupPlayer, pickupPlayer ] = useReducer(
		( s ) => s + 1,
		0
	);

	useEffect( () => {
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

		playerRef.current = new MediaElementPlayer( mediaAudio );

		playerRef.current.play();
	}, [ attempToPickupPlayer ] );

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

	const onPlayOnTime = useMemo( () => ( timeStamp ) => {
		if ( ! timeStamp ) {
			return;
		}

		const hms = timeStamp.split( ':' ).reverse();
		if ( ! hms?.length ) {
			return;
		}

		const hmsInSeconds =
			Number( hms[ 0 ] ) +
			( hms[ 1 ] ? Number( hms[ 1 ] * 60 ) : 0 ) +
			( hms[ 2 ] ? Number( hms[ 2 ] * 60 * 60 ) : 0 );

		if ( ! playerRef?.current ) {
			pickupPlayer();
			return;
		}

		playerRef.current.setCurrentTime( hmsInSeconds );
	}, [] );

	return (
		<TranscritptionContext.Provider value={ onPlayOnTime }>
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
					allowedBlocks={ TRANSCRIPTION_ALLOWED_BLOCKS }
				/>
			</div>
		</TranscritptionContext.Provider>
	);
}

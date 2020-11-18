/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { Panel, PanelBody, TextControl, ColorIndicator, BaseControl } from '@wordpress/components';
/**
 * Internal dependencies
 */
import './editor.scss';

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
	[ 'jetpack/change-log', { placeholder: __( 'logging…', 'Jetpack' ) } ],
	[ 'jetpack/change-log', { placeholder: __( 'logging…', 'Jetpack' ) } ],
	[ 'jetpack/change-log', { placeholder: __( 'logging…', 'Jetpack' ) } ],
];

export default function Transcription ( {
	className,
	attributes,
	setAttributes,
} ) {
	const { labels } = attributes;

	// Set initial transcription labels.
	useEffect( () => {
		if ( labels ) {
			return;
		}

		setAttributes( { labels: defaultLabels } );
	}, [ labels, setAttributes ] );

	const updateLabels = ( updatedLabel ) => {
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
	};

	return (
		<div class={ className }>
			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'labels', 'jetpack' ) } className={ `${ className }__labels` }>
						{ map( labels, ( { value, slug, textColor, bgColor } ) => (
							<BaseControl className={ `${ className }__label-control` }>
								<TextControl
									value={ value }
									onChange={ ( newLabelValue ) => updateLabels( { slug, value: newLabelValue } ) }
								/>
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
					</PanelBody>
				</Panel>
			</InspectorControls>
			<InnerBlocks
				template={ TRANSCRIPTION_TEMPLATE }
				allowedBlocks={ [ 'core/paragraph', 'core/heading', 'jetpack/change-log' ] }
			/>
		</div>
	);
}

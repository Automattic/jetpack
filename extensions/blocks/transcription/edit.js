/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { Panel, PanelBody, TextControl } from '@wordpress/components';
/**
 * Internal dependencies
 */
import './editor.scss';

const defaultLabels = [
	{
		slug: 'label-0',
		value: __( 'Speaker one', 'jetpack' ),
		color: 'red',
	},
	{
		slug: 'label-1',
		value: __( 'Speaker two', 'jetpack' ),
		color: 'yellow',
	},
	{
		slug: 'label-2',
		value: __( 'Speaker tree', 'jetpack' ),
		color: 'green',
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
					<PanelBody title={ __( 'labels', 'jetpack' ) }>
						{ map( labels, ( { value, slug } ) => (
							<TextControl
								value={ value }
								onChange={ ( newLabelValue ) => updateLabels( { slug, value: newLabelValue } ) }
							/>
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

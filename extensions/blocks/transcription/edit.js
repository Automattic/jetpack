
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { InnerBlocks } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import './editor.scss';

const defaultLabels = [
	{
		name: __( 'Speaker one', 'jetpack' ),
		color: 'red',
	},
	{
		name: __( 'Speaker two', 'jetpack' ),
		color: 'yellow',
	},
	{
		name: __( 'Speaker tree', 'jetpack' ),
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
	const { labels = [] } = attributes;

	// Set initial transcription labels.
	useEffect( () => {
		if ( ! labels ) {
			return;
		}

		setAttributes( { labels: defaultLabels } );
	}, [ labels, setAttributes ] );

	return (
		<div class={ className }>
			<InnerBlocks
				template={ TRANSCRIPTION_TEMPLATE }
				allowedBlocks={ [ 'core/paragraph', 'core/heading', 'jetpack/change-log' ] }
			/>
		</div>
	);
}

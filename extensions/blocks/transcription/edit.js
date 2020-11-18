
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import './editor.scss';

const defaultLabels = [
	{
		name: __( 'Alarm', 'jetpack' ),
		color: 'red',
	},
	{
		name: __( 'Warning', 'jetpack' ),
		color: 'yellow',
	},
	{
		name: __( 'Normal', 'jetpack' ),
		color: 'green',
	},
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
			{ __( 'Transcription', 'jetpack' ) }
		</div>
	);
}

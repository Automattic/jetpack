/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function VideoPressEdit() {
	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-videopress',
	} );

	return <div { ...blockProps }>{ __( 'VideoPress', 'jetpack' ) }</div>;
}

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function save() {
	const blockProps = useBlockProps.save( {
		className: 'jetpack-videopress',
	} );

	return <div { ...blockProps }>{ __( 'VideoPress', 'jetpack' ) }</div>;
}

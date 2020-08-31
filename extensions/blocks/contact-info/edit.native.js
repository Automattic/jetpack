/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
const ALLOWED_BLOCKS = [
	'jetpack/address',
	'jetpack/email',
	'jetpack/phone',
	'core/paragraph',
	'core/image',
	'core/heading',
	'core/gallery',
	'core/list',
	'core/quote',
	'core/shortcode',
	'core/audio',
	'core/code',
	'core/cover',
	'core/html',
	'core/separator',
	'core/spacer',
	'core/subhead',
	'core/video',
];

const TEMPLATE = [ [ 'jetpack/email' ], [ 'jetpack/phone' ], [ 'jetpack/address' ] ];

const ContactInfoEdit = () => {
	return (
		<View>
			<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } templateLock={ false } template={ TEMPLATE } />
		</View>
	);
};

export default ContactInfoEdit;

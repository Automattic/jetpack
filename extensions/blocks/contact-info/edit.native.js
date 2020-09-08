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
  'core/heading',
  'core/separator',
  'core/spacer',
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

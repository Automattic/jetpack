import { InnerBlocks } from '@wordpress/block-editor';
import { View } from 'react-native';
import styles from './editor.scss';

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
		<View style={ styles.jetpackContactInfoBlock }>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				templateLock={ false }
				templateInsertUpdatesSelection={ false }
				template={ TEMPLATE }
			/>
		</View>
	);
};

export default ContactInfoEdit;

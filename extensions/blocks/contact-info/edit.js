/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import classnames from 'classnames';

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

const ContactInfoEdit = props => {
	const { isSelected } = props;

	return (
		<div
			className={ classnames( {
				'jetpack-contact-info-block': true,
				'is-selected': isSelected,
			} ) }
		>
			<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } templateLock={ false } template={ TEMPLATE } />
		</div>
	);
};

export default ContactInfoEdit;

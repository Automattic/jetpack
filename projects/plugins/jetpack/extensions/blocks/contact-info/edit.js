import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

const ALLOWED_BLOCKS = [
	'jetpack/markdown',
	'jetpack/address',
	'jetpack/email',
	'jetpack/phone',
	'jetpack/map',
	'jetpack/business-hours',
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

const ContactInfoEdit = props => {
	const { isSelected } = props;
	const blockProps = useBlockProps();

	return (
		<div
			{ ...blockProps }
			className={ clsx( blockProps.className, {
				'jetpack-contact-info-block': true,
				'is-selected': isSelected,
			} ) }
		>
			<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } templateLock={ false } template={ TEMPLATE } />
		</div>
	);
};

export default ContactInfoEdit;

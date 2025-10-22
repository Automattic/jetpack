/**
 * External dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { CORE_BLOCKS } from '../shared/util/constants';

const ALLOWED_BLOCKS = [
	...CORE_BLOCKS,
	'jetpack/image-compare',
	'jetpack/markdown',
	'jetpack/slideshow',
	'jetpack/tiled-gallery',
	'videopress/video',
];

const TEMPLATE = [
	[ 'core/heading', { level: 2, content: __( 'Thank you!', 'jetpack-forms' ) } ],
	[
		'core/paragraph',
		{ content: __( 'Your message has been sent successfully.', 'jetpack-forms' ) },
	],
];

export default function FormThankYouEdit() {
	const blockProps = useBlockProps();
	blockProps.className += ' jetpack-form-thank-you__container';

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: TEMPLATE,
		templateInsertUpdatesSelection: false,
	} );

	return <div { ...innerBlocksProps } />;
}

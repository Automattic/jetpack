/**
 * External dependencies
 */
import { BlockControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Notice } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { FormViewContext } from '../contact-form/shared/context/form-view-context';
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
	const { isPostSubmitView, confirmationType, switchToFormView, switchToPostSubmitView } =
		useContext( FormViewContext );
	const blockProps = useBlockProps();
	blockProps.className += ' jetpack-form-thank-you__container';

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: TEMPLATE,
		templateInsertUpdatesSelection: false,
	} );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton isPressed={ ! isPostSubmitView } onClick={ switchToFormView }>
						{ __( 'Form', 'jetpack-forms' ) }
					</ToolbarButton>
					<ToolbarButton isPressed={ isPostSubmitView } onClick={ switchToPostSubmitView }>
						{ __( 'Response', 'jetpack-forms' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			{ 'custom' !== confirmationType && (
				<Notice
					status="warning"
					isDismissible={ false }
					className="jetpack-form-thank-you__warning"
				>
					{ __(
						'To use this confirmation view, please select the "Custom Thank You" confirmation type in the form settings.',
						'jetpack-forms'
					) }
				</Notice>
			) }
			<div { ...innerBlocksProps } />
		</>
	);
}

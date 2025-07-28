import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-forms:input-phone-number-edit' );

export default function PhoneNumberInputEdit() {
	const blockProps = useBlockProps( {
		className: `jetpack-phone-number-input`,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/input', 'jetpack/country-list-input' ],
		template: [
			[
				'jetpack/country-list-input',
				{
					className: 'jetpack-phone-number-input__dropdown',
				},
			],
			[
				'jetpack/input',
				{
					type: 'tel',
					placeholder: __( 'Phone number', 'jetpack-forms' ),
					className: 'jetpack-phone-number-input__input',
				},
			],
		],
		templateLock: 'all',
		__experimentalCaptureToolbars: true,
	} );

	debug( 'render phone input' );

	return (
		<>
			<div { ...innerBlocksProps } />
		</>
	);
}

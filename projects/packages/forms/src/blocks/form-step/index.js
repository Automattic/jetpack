import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import StepIcon from './icon';
import save from './save';

export const name = 'form-step';

export const settings = {
	apiVersion: 3,
	title: __( 'Step', 'jetpack-forms' ),
	category: 'contact-form',
	description: __( 'A single step in a multi-step form.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: StepIcon,
	},
	parent: [ 'jetpack/form-step-container' ],
	supports: {
		html: false,
		reusable: false,
		inserter: true,
		align: true,
		color: {
			gradients: true,
			link: true,
		},
		spacing: {
			padding: true,
			margin: true,
		},
	},
	attributes: {
		align: {
			type: 'string',
		},
		backgroundColor: {
			type: 'string',
		},
		gradient: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		style: {
			type: 'object',
		},
		stepLabel: {
			type: 'string',
		},
	},
	edit: edit,
	save: save,
	example: {},
	deprecated: [
		{
			// Legacy markup did not include the data-step-label attribute that is now written by the block.
			attributes: {
				align: { type: 'string' },
				backgroundColor: { type: 'string' },
				gradient: { type: 'string' },
				textColor: { type: 'string' },
				style: { type: 'object' },
				stepLabel: { type: 'string' },
			},
			isEligible: ( attributes, innerBlocks, { innerHTML } ) => {
				// Eligible when markup does NOT contain the new data attribute.
				return innerHTML && ! innerHTML.includes( 'data-step-label' );
			},
			save: () => {
				// Replicate legacy output – simply render inner blocks without extra dataset.
				const blockProps = useBlockProps.save();
				const innerBlocksProps = useInnerBlocksProps.save( blockProps );

				return <div { ...innerBlocksProps } />;
			},
			migrate: attributes => attributes, // No attribute changes required.
		},
	],
};

export default {
	name,
	settings,
};

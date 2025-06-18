import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../shared/util/block-icons';
import { isWithinContactForm } from '../shared/util/block-utils';
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
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/group' ],
				isMatch: isWithinContactForm,
				transform: ( attributes, innerBlocks ) => {
					return createBlock( 'jetpack/form-step', {}, innerBlocks || [] );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/columns' ],
				isMatch: isWithinContactForm,
				transform: ( attributes, innerBlocks ) => {
					const newInnerBlocks = innerBlocks.flatMap( column => column.innerBlocks );
					return createBlock( 'jetpack/form-step', {}, newInnerBlocks );
				},
			},
		],
	},
	example: {},
};

export default {
	name,
	settings,
};

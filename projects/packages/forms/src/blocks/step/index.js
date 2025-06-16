import { createBlock } from '@wordpress/blocks';
import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import { getIconColor } from '../shared/util/block-icons';
import { isWithinContactForm } from '../shared/util/block-utils';
import edit from './edit';
import save from './save';

export const name = 'form-step';

export const settings = {
	apiVersion: 3,
	title: __( 'Step', 'jetpack-forms' ),
	category: 'contact-form',
	description: __( 'A single step in a multi-step form.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<>
				<Path d="M17.5 9V6C17.5 5.46957 17.2893 4.96086 16.9142 4.58579C16.5391 4.21071 16.0304 4 15.5 4H8.5C7.96957 4 7.46086 4.21071 7.08579 4.58579C6.71071 4.96086 6.5 5.46957 6.5 6V9H8V6C8 5.86739 8.05268 5.74021 8.14645 5.64645C8.24021 5.55268 8.36739 5.5 8.5 5.5H15.5C15.6326 5.5 15.7598 5.55268 15.8536 5.64645C15.9473 5.74021 16 5.86739 16 6V9H17.5ZM17.5 15.5V18C17.5 18.5304 17.2893 19.0391 16.9142 19.4142C16.5391 19.7893 16.0304 20 15.5 20H8.5C7.96957 20 7.46086 19.7893 7.08579 19.4142C6.71071 19.0391 6.5 18.5304 6.5 18V15.5H8V18C8 18.1326 8.05268 18.2598 8.14645 18.3536C8.24021 18.4473 8.36739 18.5 8.5 18.5H15.5C15.6326 18.5 15.7598 18.4473 15.8536 18.3536C15.9473 18.2598 16 18.1326 16 18V15.5H17.5ZM4 13H20V11.5H4V13Z" />
			</>
		),
	},
	parent: [ 'jetpack/step-container' ],
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
			default: __( 'Step', 'jetpack-forms' ),
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

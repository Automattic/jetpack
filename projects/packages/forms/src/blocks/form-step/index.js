import { createBlock } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../contact-form/util/colors';
import { isWithinContactForm } from '../shared/util/block-utils';
import Edit from './edit';
import StepIcon from './icon';
import Save from './save';

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
	edit: Edit,
	save: Save,
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
				isMultiBlock: true,
				blocks: [ '*' ],
				isMatch: isWithinContactForm,
				transform: () => {
					try {
						const blockEditor = select( 'core/block-editor' );
						if ( ! blockEditor ) {
							return [ createBlock( 'jetpack/form-step', {} ) ];
						}

						const selectedIds = blockEditor.getSelectedBlockClientIds();
						if ( ! selectedIds?.length ) {
							return [ createBlock( 'jetpack/form-step', {} ) ];
						}

						const newBlocks = [];
						for ( const id of selectedIds ) {
							const block = blockEditor.getBlock( id );
							if ( block && block.name ) {
								newBlocks.push( createBlock( block.name, { ...block.attributes } ) );
							}
						}

						const formStep = createBlock( 'jetpack/form-step', {}, newBlocks );

						return [ formStep ];
					} catch {
						return [ createBlock( 'jetpack/form-step', {} ) ];
					}
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

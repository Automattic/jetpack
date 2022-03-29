/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Text, { SPACING_VALUES } from '../index.jsx';
import styles from './style.module.scss';

export default {
	title: 'JS Packages/Components/Text',
	component: Text,
	argTypes: {
		m: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		mt: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		mr: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		mb: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		ml: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		mx: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		my: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		p: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		pt: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		pr: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		pb: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		pl: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		px: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		py: {
			control: { type: 'select', options: SPACING_VALUES },
		},
	},
};

const Template = args => <Text { ...args }>{ args.variant ?? 'body' }</Text>;

export const Default = Template.bind( {} );

Default.args = {
	variant: 'headline-medium',
};

export const CustomTag = Template.bind( {} );

CustomTag.args = {
	variant: 'title-small',
	component: 'div',
};

const Custom = ( { className, children } ) => (
	<span className={ className }>{ children } Composition</span>
);

export const CustomComponent = Template.bind( {} );

CustomComponent.args = {
	variant: 'headline-small',
	component: Custom,
};

const BoxModelTemplate = args => (
	<div className={ styles[ 'box-model-wrapper' ] }>
		<div className={ styles[ 'box-model-side-left' ] } />
		<div className={ styles[ 'box-model-side-center' ] }>
			<Text { ...args }>
				<div className={ styles[ 'box-model-inner' ] }>Box Model</div>
			</Text>
		</div>
		<div className={ styles[ 'box-model-side-right' ] } />
	</div>
);

export const BoxModel = BoxModelTemplate.bind( {} );

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { Title, TIPOGRAPHY_SIZES } from '../index.jsx';
import styles from './style.module.scss';

export default {
	title: 'JS Packages/Components/Text/Title',
	component: Title,
	argTypes: {
		children: {
			control: { type: 'text' },
		},
		size: {
			control: { type: 'select', options: Object.values( TIPOGRAPHY_SIZES ) },
		},
	},
};

const Template = args => (
	<div className={ styles.instance }>
		<span>Text above to the the component...</span>
		<Title { ...args }>
			{ args?.children || 'Title Medium - Secure, grow, and increase your site speed' }
		</Title>
		<span>Text below to the the component...</span>
	</div>
);

export const Default = Template.bind( {} );
Default.args = {
	size: TIPOGRAPHY_SIZES.medium,
};

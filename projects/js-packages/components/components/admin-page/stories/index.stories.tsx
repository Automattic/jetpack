import React from 'react';
import JetpackLogo from '../../jetpack-logo/index.js';
import Text from '../../text/index.js';
import AdminPage from '../index.js';
import styles from './style.module.scss';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof AdminPage > = {
	title: 'JS Packages/Components/Admin Page',
	component: AdminPage,
	argTypes: {
		moduleName: { control: 'text', defaultValue: 'Jetpack' },
		showHeader: { control: 'boolean', defaultValue: true },
		showFooter: { control: 'boolean', defaultValue: true },
		showBackground: { control: 'boolean', defaultValue: true },
	},
};

export default meta;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof AdminPage > = args => <AdminPage { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const CustomHeader = Template.bind( {} );
CustomHeader.args = {
	header: (
		<div className={ styles[ 'custom-header' ] }>
			<JetpackLogo height={ 40 } />
			<Text className={ styles[ 'logo-title' ] }>Next Product is coming up</Text>
		</div>
	),
};

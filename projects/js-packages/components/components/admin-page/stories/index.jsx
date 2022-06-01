import React from 'react';
import JetpackLogo from '../../jetpack-logo/index';
import Text from '../../text/index';
import AdminPage from '../index.jsx';
import styles from './style.module.scss';

export default {
	title: 'JS Packages/Components/Admin Page',
	component: AdminPage,
};

// Export additional stories using pre-defined values
const Template = args => <AdminPage { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const CustomHeader = Template.bind( {} );
CustomHeader.args = {
	header: (
		<div className={ styles[ 'custom-header' ] }>
			<JetpackLogo height={ 40 } />
			<Text className={ styles[ 'logo-title' ] } weight="regular">
				Next Product is coming up
			</Text>
		</div>
	),
};

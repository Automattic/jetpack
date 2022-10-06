import React from 'react';
import ManageConnectionDialog from '..';

export default {
	title: 'JS Packages/Connection/Manage Connection Dialog',
	component: ManageConnectionDialog,
};

const Template = args => <ManageConnectionDialog { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	isOpen: true,
};

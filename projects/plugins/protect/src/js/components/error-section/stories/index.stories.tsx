import React from 'react';
import ErrorScreen from '..';

export default {
	title: 'Plugins/Protect/ErrorScreen',
	component: ErrorScreen,
};

const Template = args => <ErrorScreen { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	baseErrorMessage: 'An error occurred',
	errorMessage: 'Error message',
	errorCode: '500',
};

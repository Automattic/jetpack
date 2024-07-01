/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import ButtonGroup from '../index.jsx';

export default {
	title: 'Plugins/Protect/Button Group',
	component: ButtonGroup,
	argTypes: {},
};

const FooterTemplate = args => <ButtonGroup { ...args } />;
export const Default = FooterTemplate.bind( {} );

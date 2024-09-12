/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import ScanFooter from '../index.jsx';

export default {
	title: 'Plugins/Protect/Scan Footer',
	component: ScanFooter,
};

const FooterTemplate = args => <ScanFooter { ...args } />;
export const Default = FooterTemplate.bind( {} );

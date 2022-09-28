/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import Footer from '../index.jsx';

export default {
	title: 'Plugins/Protect/Footer',
	component: Footer,
};

const FooterTemplate = args => <Footer { ...args } />;
export const Default = FooterTemplate.bind( {} );

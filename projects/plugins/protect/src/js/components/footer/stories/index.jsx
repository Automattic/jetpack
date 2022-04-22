/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Footer from '../index.jsx';

export default {
	title: 'Plugins/Protect/Footer',
	component: Footer,
};

const FooterTemplate = args => <Footer { ...args } />;
export const Default = FooterTemplate.bind( {} );

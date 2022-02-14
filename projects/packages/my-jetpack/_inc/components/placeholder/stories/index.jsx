/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Placeholder from '../';

export default {
	title: 'Packages/My Jetpack/Placeholder',
	component: Placeholder,
};

const Template = args => <Placeholder { ...args } />;

const DefaultArgs = {
	rows: 3,
	cols: [ { xs: 3, md: 7, lg: 11 }, null, { xs: 2, md: 6, lg: 10 } ],
	heights: [ 20, null, null ],
};

export const Default = Template.bind( {} );
Default.args = DefaultArgs;

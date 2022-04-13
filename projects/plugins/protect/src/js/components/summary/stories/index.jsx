/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Summary from '..';

export default {
	title: 'Plugins/Protect/Summary',
	component: Summary,
};

const Template = args => <Summary { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	wordpressVuls: 1,
	themesVuls: 2,
	pluginsVuls: 3,
};

export const Empty = Template.bind( {} );
Empty.args = {
	wordpressVuls: 0,
	themesVuls: 0,
	pluginsVuls: 0,
};

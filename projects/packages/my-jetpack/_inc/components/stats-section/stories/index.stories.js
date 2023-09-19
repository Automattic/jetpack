import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { initStore } from '../../../state/store';
import StatsSection from '../index.jsx';

initStore();

export default {
	title: 'Packages/My Jetpack/Stats Section',
	component: StatsSection,
};

const DefaultArgs = {
	counts: {
		views: 4652,
		visitors: 1500,
		likes: 107,
		comments: 32,
	},
	previousCounts: {
		views: 3749,
		visitors: 1200,
		likes: 111,
		comments: 34,
	},
};

const Template = args => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <StatsSection { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const Default = Template.bind( {} );
Default.parameters = {};
Default.args = DefaultArgs;

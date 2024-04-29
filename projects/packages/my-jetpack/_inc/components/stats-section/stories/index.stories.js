import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import StatsCards from '../cards.jsx';

export default {
	title: 'Packages/My Jetpack/Stats Cards',
	component: StatsCards,
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
			<Route path="/" element={ <StatsCards { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const Default = Template.bind( {} );
Default.parameters = {};
Default.args = DefaultArgs;

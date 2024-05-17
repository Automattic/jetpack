import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Card from '..';

export default {
	title: 'Packages/My Jetpack/Card',
	component: Card,
};

const DefaultArgs = {
	title: 'Stats',
	headerRightContent: <div>Right content</div>,
	children: (
		<p>
			Lorem ipsum dolor <b>sit amet</b>, consectetur adipiscing elit. Cras rutrum neque odio, vel
			viverra lectus vulputate et.
		</p>
	),
};

const Template = args => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <Card { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const Default = Template.bind( {} );
Default.parameters = {};
Default.args = DefaultArgs;

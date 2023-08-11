import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import CloseLink from '..';

export default {
	title: 'Packages/My Jetpack/CloseLink',
	component: CloseLink,
};

const DefaultArgs = {};

const Template = args => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <CloseLink { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const _default = Template.bind( {} );
_default.parameters = {};
_default.args = DefaultArgs;

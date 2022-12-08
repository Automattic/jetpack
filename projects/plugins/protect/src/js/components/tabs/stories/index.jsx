import React from 'react';
import { HashRouter } from 'react-router-dom';
import Tabs, { Tab } from '..';

export default {
	title: 'Plugins/Protect/Tabs',
	component: Tabs,
};

export const Default = () => (
	<HashRouter>
		<Tabs>
			<Tab link="/" label="Scan" />
			<Tab link="/firewall" label="Firewall" />
		</Tabs>
	</HashRouter>
);

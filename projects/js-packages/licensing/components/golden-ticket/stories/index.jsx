import React from 'react';
import GoldenTicket from '../index';

export default {
	title: 'JS Packages/Licensing/GoldenTicket',
	component: GoldenTicket,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		redirectUri: { table: { disable: true } },
		migrateCallback: { table: { disable: true } },
		finishMigrationCallback: { table: { disable: true } },
		startFreshCallback: { table: { disable: true } },
	},
};

const Template = args => <GoldenTicket { ...args } />;

const DefaultArgs = {};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

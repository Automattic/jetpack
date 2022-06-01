import React from 'react';
import IDCScreenVisual from '../visual';

export default {
	title: 'JS Packages/Identity Crisis/Admin Screen',
	component: IDCScreenVisual,
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

const Template = args => <IDCScreenVisual { ...args } />;

const DefaultArgs = {
	wpcomHomeUrl: 'https://site1.example.org',
	currentUrl: 'https://site2.example.org',
	redirectUri: '',
	isMigrated: false,
	isFinishingMigration: false,
	isMigrating: false,
	isStartingFresh: false,
	isAdmin: true,
	hasMigrateError: false,
	hasFreshError: false,
	hasStaySafeError: false,
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

export const Migrated = Template.bind( {} );
Migrated.args = {
	...DefaultArgs,
	isMigrated: true,
};

export const NonAdmin = Template.bind( {} );
NonAdmin.args = {
	...DefaultArgs,
	isAdmin: false,
};

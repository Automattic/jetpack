import { Tooltip } from '../tooltip';
import type { Meta } from '@storybook/react';

const meta: Meta< typeof Tooltip > = {
	title: 'JS Packages/Components/Boost Score Tooltip',
	component: Tooltip,
	argTypes: {
		date: { control: 'date' },
		desktopScore: { control: 'number', min: 0, max: 100 },
		mobileScore: { control: 'number', min: 0, max: 100 },
	},
	decorators: [
		Story => (
			<div style={ { width: '300px', margin: '200px auto', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;

const Template = args => {
	args.date = new Date( args.date ).toLocaleDateString( 'en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	} );

	return <Tooltip { ...args } />;
};
export const _default = Template.bind( {} );
_default.args = {
	date: '2021-08-23',
	desktopScore: 90,
	mobileScore: 80,
};

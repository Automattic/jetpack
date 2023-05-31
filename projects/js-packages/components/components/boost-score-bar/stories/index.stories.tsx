import BoostScoreBar from '../index';
import type { Meta } from '@storybook/react';

const meta: Meta< typeof BoostScoreBar > = {
	title: 'JS Packages/Components/Boost Score Bar',
	component: BoostScoreBar,
	argTypes: {
		score: { control: 'range', min: 0, max: 100, defaultValue: 80 },
		prevScore: { control: 'range', min: 0, max: 100 },
		isLoading: { control: 'boolean' },
		showPrevScores: { control: 'boolean' },
		active: { control: 'boolean' },
		scoreBarType: { control: 'radio', options: [ 'desktop', 'mobile' ] },
		noBoostScoreTooltip: { control: 'text' },
	},
	decorators: [
		Story => (
			<div style={ { width: '80%', maxWidth: '1320px', margin: '200px auto', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

const defaultValues = {
	score: 80,
	prevScore: 70,
	isLoading: false,
	showPrevScores: true,
	active: true,
	scoreBarType: 'desktop',
	noBoostScoreTooltip: 'No boost score',
};

export default meta;

const Template = args => <BoostScoreBar { ...args } />;
export const _default = Template.bind( {} );
_default.args = defaultValues;

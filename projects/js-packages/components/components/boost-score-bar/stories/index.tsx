import BoostScoreBar from '..';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Boost Score Bar',
	component: BoostScoreBar,
	argTypes: {
		score: { control: 'number', defaultValue: 80, min: 0, max: 100 },
		isLoading: { control: 'boolean', defaultValue: false },
		showPrevScores: { control: 'boolean', defaultValue: false },
		active: { control: 'boolean', defaultValue: true },
		prevScore: { control: 'number', defaultValue: 70, min: 0, max: 100 },
		scoreBarType: { control: 'text', options: [ 'desktop', 'mobile' ], defaultValue: 'desktop' },
		noBoostScoreTooltip: { control: 'text', defaultValue: false },
	},
	decorators: [
		Story => (
			<div style={ { width: '80%', maxWidth: '1320px', margin: '200px auto', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
} as ComponentMeta< typeof BoostScoreBar >;

const Template: ComponentStory< typeof BoostScoreBar > = args => <BoostScoreBar { ...args } />;

export const _default = Template.bind( {} );

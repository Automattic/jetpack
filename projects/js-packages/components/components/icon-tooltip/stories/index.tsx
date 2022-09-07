import IconTooltip from '../index';
import type { Placement } from '@floating-ui/react-dom';

const AVAILABLE_PLACEMENTS: Placement[] = [
	'top',
	'top-start',
	'top-end',
	'bottom',
	'bottom-start',
	'bottom-end',
];

export default {
	title: 'JS Packages/Components/IconTooltip',
	component: IconTooltip,
	argTypes: {
		placement: {
			control: { type: 'select' },
			options: AVAILABLE_PLACEMENTS,
		},
		animate: {
			control: { type: 'boolean' },
		},
		iconCode: {
			control: { type: 'text' },
		},
		title: {
			control: { type: 'text' },
		},
		children: {
			control: { type: null },
		},
	},
};

const Template = args => (
	<div style={ { position: 'absolute', height: '2000px', left: '400px', top: '400px' } }>
		<IconTooltip { ...args } />
	</div>
);

// Export Default story
export const _default = Template.bind( {} );

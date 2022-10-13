import Button from '../../button';
import DonutMeter from '../../donut-meter';
import IconTooltip from '../index';
import './style.scss';
import type { Placement } from '../types';

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
		className: {
			control: { type: 'text' },
		},
		iconClassName: {
			control: { type: 'text' },
		},
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
		iconSize: {
			control: { type: 'number' },
		},
		offset: {
			control: { type: 'number' },
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
	<div style={ { position: 'absolute', height: '1000px', left: '300px', top: '200px' } }>
		<IconTooltip { ...args } />
	</div>
);

const NewTemplate = args => (
	<div style={ { position: 'absolute', height: '1000px', left: '300px', top: '300px' } }>
		<div className="donut-meter-wrapper">
			<DonutMeter segmentCount={ 100 } totalCount={ 500 } />
			<div className="upgrade-tooltip-shadow-anchor">
				<IconTooltip { ...args }>
					<>
						<div>Thank you for upgrading! Now your visitors can search up to 500 records.</div>
						<div className="upgrade-tooltip-actions">
							<span>1 of 2</span>
							<Button>Next</Button>
						</div>
					</>
				</IconTooltip>
			</div>
		</div>
	</div>
);

// Export Default story
export const _default = Template.bind( {} );

export const HasContent = Template.bind( {} );
HasContent.args = {
	title: 'This is title!',
	children: (
		<div>
			This is children block!<br></br>
			<br></br>Break Line!
		</div>
	),
};

export const ShadowAnchor = NewTemplate.bind( {} );
ShadowAnchor.args = {
	shadowAnchor: true,
	title: 'Site records increased',
	placement: 'top',
	forceShow: true,
};

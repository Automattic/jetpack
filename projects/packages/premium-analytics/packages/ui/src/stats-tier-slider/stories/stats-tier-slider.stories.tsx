import { action } from 'storybook/actions';
import { useArgs } from 'storybook/preview-api';
import { StatsTierSlider } from '../stats-tier-slider';
import type { StatsUpgradeTier } from '@jetpack-premium-analytics/data';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';

const NEW_PURCHASE: StatsUpgradeTier[] = [
	{ views: 10000, price: 10000, upgradePrice: 0 },
	{ views: 100000, price: 20000, upgradePrice: 0 },
	{ views: 250000, price: 30000, upgradePrice: 0 },
	{ views: 500000, price: 50000, upgradePrice: 0 },
	{ views: 1000000, price: 70000, upgradePrice: 0 },
	{ views: 2000000, price: 95000, upgradePrice: 0, perUnitFee: 25000, extensionStep: 1000000 },
];

const UPGRADE_FROM_100K: StatsUpgradeTier[] = [
	{ views: 250000, price: 30000, upgradePrice: 10000 },
	{ views: 500000, price: 50000, upgradePrice: 30000 },
	{ views: 1000000, price: 70000, upgradePrice: 50000 },
	{ views: 2000000, price: 95000, upgradePrice: 75000, perUnitFee: 25000, extensionStep: 1000000 },
	{ views: 3000000, price: 120000, upgradePrice: 100000, perUnitFee: 25000 },
	{ views: 4000000, price: 145000, upgradePrice: 125000, perUnitFee: 25000 },
];

const logChange = action( 'onChange' );

/**
 * Renders the slider with its `value` arg kept in step with the control and the slider.
 *
 * @param args - The story args.
 * @return The slider.
 */
function ControlledTemplate( args: ComponentProps< typeof StatsTierSlider > ) {
	// Storybook hooks only work in the story's own render function, not in a nested component.
	const [ , updateArgs ] = useArgs();
	const onChange = ( value: number ) => {
		logChange( value );
		updateArgs( { value } );
	};
	return <StatsTierSlider { ...args } onChange={ onChange } />;
}

const meta: Meta< typeof StatsTierSlider > = {
	title: 'Packages/Premium Analytics/UI/StatsTierSlider',
	component: StatsTierSlider,
	tags: [ 'autodocs' ],
	render: ControlledTemplate,
	parameters: {
		docs: {
			description: {
				component:
					'Picks a Stats tier by its monthly views limit and shows the monthly price. ' +
					'Feed it `useStatsUpgradeTiers()`: a site that already holds a tier sees only ' +
					'the tiers above it, priced as the difference.',
			},
		},
	},
	args: { currencyCode: 'USD', value: 0 },
	argTypes: { onChange: { control: false } },
};
export default meta;

type Story = StoryObj< typeof StatsTierSlider >;

export const NewPurchase: Story = {
	args: { tiers: NEW_PURCHASE },
};

export const Upgrade: Story = {
	args: { tiers: UPGRADE_FROM_100K },
};

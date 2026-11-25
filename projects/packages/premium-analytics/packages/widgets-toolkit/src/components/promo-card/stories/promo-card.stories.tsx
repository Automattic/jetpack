import { PromoCard } from '../promo-card';
import type { Promo } from '@jetpack-premium-analytics/data';
import type { Meta, StoryObj } from '@storybook/react';

const basePromo: Promo = {
	slug: 'storybook/offer',
	placement: 'settings',
	order: 10,
	title: 'Grow your audience with Acme',
	description: 'Turn readers into subscribers with tools that work alongside your dashboard.',
	cta_label: 'Try Acme',
	cta_url: 'https://example.com/acme',
	dismissible: false,
	snooze_days: 90,
};

const meta: Meta< typeof PromoCard > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/PromoCard',
	component: PromoCard,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'A promo drawn as a card: the frame, the title, the close control when it is dismissible, and the registered description and call to action.',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof PromoCard >;

export const Default: Story = {
	args: { promo: basePromo },
};

export const Dismissible: Story = {
	args: {
		promo: {
			...basePromo,
			slug: 'storybook/dismissible',
			dismissible: true,
		},
	},
};

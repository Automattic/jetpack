import { Stack, Text } from '@jetpack-premium-analytics/externals';
import { PromoCard } from '../promo-card';
import { PromoCta } from '../promo-cta';
import type { PromoRenderProps } from '../types';
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
	render_module: null,
};

function FixtureModule( { promo, trackClick }: PromoRenderProps ) {
	return (
		<Stack direction="row" gap="xl" align="center" justify="space-between">
			<Stack direction="column" gap="xs">
				<Text variant="body-sm">Acme insights</Text>
				<Text variant="heading-lg">12,480 readers this month</Text>
			</Stack>
			<Stack direction="row" gap="sm">
				<span>Newsletter</span>
				<span>Paid</span>
				<span>Social</span>
			</Stack>
			<Stack direction="column" gap="sm" align="flex-start">
				<PromoCta
					href={ promo.cta_url }
					label={ promo.cta_label }
					variant="primary"
					trackClick={ trackClick }
				/>
				<PromoCta
					href="https://example.com/acme/pricing"
					label="See pricing"
					variant="secondary"
					trackClick={ trackClick }
				/>
			</Stack>
		</Stack>
	);
}

const meta: Meta< typeof PromoCard > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/PromoCard',
	component: PromoCard,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'A registered promo drawn as a card. The card owns the frame, the title and the close control. Without a render module it also draws the registered description and call to action; with one, that module draws the content region under the title. A module that fails to load or render falls back to the registered copy.',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof PromoCard >;

export const DataOnly: Story = {
	args: { promo: basePromo },
};

export const DataOnlyDismissible: Story = {
	args: {
		promo: {
			...basePromo,
			slug: 'storybook/dismissible',
			dismissible: true,
		},
	},
};

export const WithModule: Story = {
	args: {
		promo: { ...basePromo, slug: 'storybook/module', render_module: 'storybook/module' },
		resolveModule: () => Promise.resolve( { default: FixtureModule } ),
	},
	decorators: [
		Story => (
			<div style={ { inlineSize: 960 } }>
				<Story />
			</div>
		),
	],
};

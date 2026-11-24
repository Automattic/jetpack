import { Stack, Text } from '@jetpack-premium-analytics/externals';
import { PromoCard } from '../promo-card';
import { PromoCta } from '../promo-cta';
import type { PromoRenderProps } from '../types';
import type { Promo } from '@jetpack-premium-analytics/data';
import type { Meta, StoryObj } from '@storybook/react';

const basePromo: Promo = {
	slug: 'storybook/offer',
	placement: 'settings',
	target: null,
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

function ThrowingModule(): never {
	throw new Error( 'The promo module failed to render.' );
}

const meta: Meta< typeof PromoCard > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/PromoCard',
	component: PromoCard,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'A promo another plugin registered, drawn as a card. Without a render module the card draws the registered title, description and call to action. With one, the module draws the whole content region and the card keeps only its frame and close control. A module that fails to load or render falls back to the data-only card.',
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
			placement: 'section-footer',
			target: 'traffic',
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

export const ModuleThrows: Story = {
	args: {
		promo: { ...basePromo, slug: 'storybook/throws', render_module: 'storybook/throws' },
		resolveModule: () => Promise.resolve( { default: ThrowingModule } ),
	},
	parameters: {
		docs: {
			description: {
				story: 'The module throws on render, so the card shows the data-only content instead.',
			},
		},
	},
};

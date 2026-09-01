import Button from '../../button/index.tsx';
import ProductPrice from '../../product-price/index.tsx';
import PricingTable, {
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
} from '../index.tsx';
import Logo from './logo.jsx';
import type { StoryFn, Meta } from '@storybook/react';

/**
 * Story args extend the component props with story-only controls (e.g. a toggle
 * forwarded to the nested ProductPrice).
 */
type StoryArgs = React.ComponentProps< typeof PricingTable > & {
	hideDiscountLabel?: boolean;
};

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Components/Pricing Table',
	component: PricingTable,
	subcomponents: { PricingTableColumn, PricingTableHeader, PricingTableItem },
};

export default meta;

const Template: StoryFn< StoryArgs > = args => {
	return (
		<PricingTable { ...args }>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						price={ 9.95 }
						offPrice={ 4.98 }
						legend="/month, billed yearly"
						currency="USD"
						hideDiscountLabel={ args?.hideDiscountLabel }
					/>
					<Button fullWidth>Get Premium</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } label={ <strong>Up to 1000</strong> } />
				<PricingTableItem isIncluded={ true } tooltipInfo={ 'This is an info' } />
				<PricingTableItem
					isIncluded={ true }
					tooltipInfo={ 'This is an info with title' }
					tooltipTitle={ 'Small title' }
				/>
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
			</PricingTableColumn>
			<PricingTableColumn>
				<PricingTableHeader>
					<ProductPrice price={ 0 } legend="Free forever" currency="USD" hidePriceFraction />
					<Button fullWidth variant="secondary">
						Start for free
					</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } label="Up to 300" />
				<PricingTableItem
					isIncluded={ false }
					label="This is not included"
					tooltipInfo="This has a tooltip, so its overwrites the default info on small screens"
				/>
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
			</PricingTableColumn>
		</PricingTable>
	);
};

// Feature arrays for stories
const socialFeatures = [
	{ name: 'Priority support' },
	{ name: 'Schedule posting' },
	{
		name: 'Share to Facebook, Instagram, LinkedIn',
	},
	{ name: 'Customize publications' },
	{
		name: 'Recycle content',
		tooltipInfo: 'Repurpose, reuse or republish already published content.',
	},
	{
		name: 'Upload custom images with your posts',
	},
	{
		name: 'Upload videos with your posts',
	},
	{
		name: 'Automatically generate images for posts',
		tooltipInfo: 'Automatically create custom images, saving you hours of tedious work.',
	},
	{
		name: 'Multi-image sharing',
		tooltipTitle: 'Coming soon',
		tooltipInfo: 'Share multiple images at once on social media platforms.',
	},
];

const DefaultArgs = {
	title: 'Buy premium, or start for free',
	items: [
		{ name: 'Feature A with limit', tooltipInfo: 'Default info for Feature A' },
		{ name: 'Feature B', tooltipInfo: 'Default info for Feature B' },
		{
			name: 'Feature C with a longer title that will span multiple lines',
			tooltipInfo: 'Default info for Feature C',
			tooltipTitle: 'Title for C',
		},
		{ name: 'Feature D', tooltipInfo: 'Default info for Feature D', tooltipTitle: 'Title for D' },
		{ name: 'Feature E' },
	],
	hideDiscountLabel: false,
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

const WithLogoTemplate: StoryFn< StoryArgs > = args => {
	return (
		<PricingTable { ...args }>
			<PricingTableColumn primary>
				<PricingTableHeader title="Social">
					<ProductPrice
						price={ 24.95 }
						offPrice={ 12.48 }
						legend="/month, billed yearly"
						currency="USD"
						hidePriceFraction
						variant="simple"
					/>
					<Button fullWidth>Get Social</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ false } isComingSoon={ true } />
			</PricingTableColumn>
			<PricingTableColumn>
				<PricingTableHeader title="Free">
					<ProductPrice
						price={ 0 }
						legend="Free forever"
						currency="USD"
						hidePriceFraction
						variant="simple"
					/>
					<Button fullWidth variant="secondary">
						Start for free
					</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
			</PricingTableColumn>
		</PricingTable>
	);
};

export const WithLogo = WithLogoTemplate.bind( {} );
WithLogo.args = {
	title: 'Write once, post everywhere',
	headerLogo: <Logo height={ 32 } />,
	items: socialFeatures,
	showIntroOfferDisclaimer: false,
};

const CustomLabelsTemplate: StoryFn< StoryArgs > = args => {
	return (
		<PricingTable { ...args }>
			<PricingTableColumn>
				<PricingTableHeader>
					<ProductPrice price={ 0 } currency="USD" hidePriceFraction />
					<Button fullWidth variant="secondary">
						Free
					</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } label="Basic version" />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ true } label="5 per month" />
			</PricingTableColumn>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice price={ 15.95 } currency="USD" hidePriceFraction legend="/month" />
					<Button fullWidth>Pro</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } label="Full version" />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } label="Unlimited" />
			</PricingTableColumn>
		</PricingTable>
	);
};

export const WithCustomLabels = CustomLabelsTemplate.bind( {} );
WithCustomLabels.args = {
	title: 'Feature comparison',
	items: [ { name: 'Custom feature' }, { name: 'Special feature' }, { name: 'Limited feature' } ],
	showIntroOfferDisclaimer: false,
};

const ThreeColumnsTemplate: StoryFn< StoryArgs > = args => {
	return (
		<PricingTable { ...args }>
			<PricingTableColumn>
				<PricingTableHeader title="Starter">
					<ProductPrice
						price={ 0 }
						legend="Free forever"
						currency="USD"
						hidePriceFraction
						variant="simple"
					/>
					<Button fullWidth variant="secondary">
						Start Free
					</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } label="Up to 5 sites" />
				<PricingTableItem isIncluded={ true } label="Basic features" />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
			</PricingTableColumn>
			<PricingTableColumn primary>
				<PricingTableHeader title="Professional">
					<ProductPrice
						price={ 24.95 }
						offPrice={ 12.48 }
						legend="/month, billed yearly"
						currency="USD"
						hidePriceFraction
						variant="simple"
					/>
					<Button fullWidth>Get Professional</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } label="Up to 50 sites" />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } label="Advanced analytics" />
				<PricingTableItem isIncluded={ true } label="Priority support" />
				<PricingTableItem isIncluded={ true } label="Custom integrations" />
				<PricingTableItem isIncluded={ false } />
			</PricingTableColumn>
			<PricingTableColumn>
				<PricingTableHeader title="Enterprise">
					<ProductPrice
						price={ 99.95 }
						offPrice={ 79.96 }
						legend="/month, billed yearly"
						currency="USD"
						hidePriceFraction
						variant="simple"
					/>
					<Button fullWidth variant="secondary">
						Contact Sales
					</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } label="Unlimited sites" />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } label="White-label solution" />
			</PricingTableColumn>
		</PricingTable>
	);
};

export const ThreeColumns = ThreeColumnsTemplate.bind( {} );
ThreeColumns.args = {
	title: 'Choose your plan',
	items: [
		{ name: 'Sites included' },
		{ name: 'Essential features' },
		{ name: 'Analytics & reporting' },
		{ name: 'Customer support' },
		{ name: 'API access' },
		{ name: 'Enterprise features' },
	],
	headerLogo: <Logo height={ 32 } />,
	showIntroOfferDisclaimer: false,
};

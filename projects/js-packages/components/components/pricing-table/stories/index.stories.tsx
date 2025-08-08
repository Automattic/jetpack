import { __ } from '@wordpress/i18n';
import Logo from '../../../../publicize-components/src/components/admin-page/page-header/logo.js';
import Button from '../../button/index.tsx';
import ProductPrice from '../../product-price/index.tsx';
import PricingTable, {
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
} from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof PricingTable > = {
	title: 'JS Packages/Components/Pricing Table',
	component: PricingTable,
	subcomponents: { PricingTableColumn, PricingTableHeader, PricingTableItem },
};

export default meta;

const Template: StoryFn< typeof PricingTable > = args => {
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
	{ name: __( 'Priority support', 'jetpack-components' ) },
	{ name: __( 'Schedule posting', 'jetpack-components' ) },
	{
		name: __(
			'Share to Facebook, Instagram, LinkedIn, Mastodon, Tumblr, Threads, Bluesky, and Nextdoor',
			'jetpack-components'
		),
	},
	{ name: __( 'Customize publications', 'jetpack-components' ) },
	{
		name: __( 'Recycle content', 'jetpack-components' ),
		tooltipInfo: __(
			'Repurpose, reuse or republish already published content.',
			'jetpack-components'
		),
	},
	{
		name: __( 'Upload custom images with your posts', 'jetpack-components' ),
	},
	{
		name: __( 'Upload videos with your posts', 'jetpack-components' ),
	},
	{
		name: __( 'Automatically generate images for posts', 'jetpack-components' ),
		tooltipInfo: __(
			'Automatically create custom images, saving you hours of tedious work.',
			'jetpack-components'
		),
	},
	{
		name: __( 'Multi-image sharing', 'jetpack-components' ),
		tooltipTitle: __( 'Coming soon', 'jetpack-components' ),
		tooltipInfo: __(
			'Share multiple images at once on social media platforms.',
			'jetpack-components'
		),
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

const WithLogoTemplate: StoryFn< typeof PricingTable > = args => {
	return (
		<PricingTable { ...args }>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						price={ 24.95 }
						offPrice={ 12.48 }
						legend={ __(
							'per month for the first year, then billed yearly',
							'jetpack-components'
						) }
						currency="USD"
						hidePriceFraction
					/>
					<Button fullWidth>{ __( 'Get Social', 'jetpack-components' ) }</Button>
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
				<PricingTableHeader>
					<ProductPrice price={ 0 } legend="Free forever" currency="USD" hidePriceFraction />
					<Button fullWidth variant="secondary">
						{ __( 'Start for free', 'jetpack-components' ) }
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
	title: __( 'Write once, post everywhere', 'jetpack-components' ),
	headerLogo: <Logo height={ 32 } />,
	items: socialFeatures,
	showIntroOfferDisclaimer: true,
};

const CustomLabelsTemplate: StoryFn< typeof PricingTable > = args => {
	return (
		<PricingTable { ...args }>
			<PricingTableColumn>
				<PricingTableHeader>
					<ProductPrice price={ 0 } currency="USD" hidePriceFraction />
					<Button fullWidth variant="secondary">
						{ __( 'Free', 'jetpack-components' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem
					isIncluded={ true }
					label={ __( 'Basic version', 'jetpack-components' ) }
				/>
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ true } label="5 per month" />
			</PricingTableColumn>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice price={ 15.95 } currency="USD" hidePriceFraction legend="/month" />
					<Button fullWidth>{ __( 'Pro', 'jetpack-components' ) }</Button>
				</PricingTableHeader>
				<PricingTableItem
					isIncluded={ true }
					label={ __( 'Full version', 'jetpack-components' ) }
				/>
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } label={ __( 'Unlimited', 'jetpack-components' ) } />
			</PricingTableColumn>
		</PricingTable>
	);
};

export const WithCustomLabels = CustomLabelsTemplate.bind( {} );
WithCustomLabels.args = {
	title: __( 'Feature comparison', 'jetpack-components' ),
	items: [
		{ name: __( 'Custom feature', 'jetpack-components' ) },
		{ name: __( 'Special feature', 'jetpack-components' ) },
		{ name: __( 'Limited feature', 'jetpack-components' ) },
	],
	showIntroOfferDisclaimer: false,
};

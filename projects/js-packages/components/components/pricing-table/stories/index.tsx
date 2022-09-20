import Button from '../../button';
import ProductPrice from '../../product-price';
import PricingTable, { PricingTableColumn, PricingTableHeader, PricingTableItem } from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Pricing Table',
	component: PricingTable,
	subcomponents: { PricingTableColumn, PricingTableHeader, PricingTableItem },
} as ComponentMeta< typeof PricingTable >;

const Template: ComponentStory< typeof PricingTable > = args => (
	<PricingTable { ...args }>
		<PricingTableColumn primary>
			<PricingTableHeader>
				<ProductPrice
					price={ 9.95 }
					offPrice={ 4.98 }
					leyend="/month, billed yearly"
					currency="USD"
					promoLabel="50% off"
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
				<ProductPrice price={ 0 } leyend="Free forever" currency="USD" hidePriceFraction />
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
		{ name: 'Feature E', tooltipInfo: 'Default info for Feature E' },
	],
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

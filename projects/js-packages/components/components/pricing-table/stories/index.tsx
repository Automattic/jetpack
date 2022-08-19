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
		<PricingTableColumn>
			<PricingTableHeader>
				<ProductPrice
					price={ 9.95 }
					offPrice={ 4.98 }
					leyend="/month, billed yearly"
					currency="USD"
				/>
				<Button fullWidth>Get Premium</Button>
			</PricingTableHeader>
			<PricingTableItem isIncluded={ true } label={ <strong>Up to 1000</strong> } />
			<PricingTableItem isIncluded={ true } />
			<PricingTableItem isIncluded={ true } />
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
			<PricingTableItem isIncluded={ true } />
			<PricingTableItem isIncluded={ true } />
			<PricingTableItem isIncluded={ true } />
			<PricingTableItem isIncluded={ false } />
		</PricingTableColumn>
	</PricingTable>
);

const DefaultArgs = {
	title: 'Buy premium, or start for free',
	items: [
		'Feature A with limit',
		'Feature B',
		'Feature C with a longer title that will span multiple lines',
		'Feature D',
		'Feature E',
	],
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

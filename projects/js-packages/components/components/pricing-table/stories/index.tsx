import Button from '../../button';
import ProductPrice from '../../product-price';
import PricingTable from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Pricing Table',
	component: PricingTable,
} as ComponentMeta< typeof PricingTable >;

const Template: ComponentStory< typeof PricingTable > = args => <PricingTable { ...args } />;

const DefaultArgs = {
	title: 'Buy premium, or start for free',
	headers: [ <h2>Column 1</h2>, <h2>Column 2</h2> ],
	table: [
		{ label: 'Number of shares', values: [ true, false ] },
		{ label: 'Schedule your posts', values: [ false, false ] },
		{
			label: 'Use multiple social channels',
			values: [
				{
					value: true,
					icon: 'info',
					label: 'A custom label',
				},
				true,
			],
		},
	],
};

const DefaultArgs = {
	title: 'Buy premium, or start for free',
	items: {
		numberOfShares: 'Number of shares',
		scheduling: 'Schedule your posts',
		socialChannels: 'Use multiple social channels',
	},
	columns: [
		{
			header: <h2>Column 1</h2>,
			values: {
				numberOfShares: true,
				scheduling: false,
				socialChannels: {
					value: true,
					icon: 'info',
					label: 'A custom label',
				},
			},
		},
		{
			header: <h2>Column 2</h2>,
			values: {
				numberOfShares: false,
				scheduling: false,
				socialChannels: true,
			},
		},
	],
};

{/* <PricingTable items={ items }>
	<PricingTableColumn
		values={ {
			numberOfShares: true,
			scheduling: false,
			socialChannels: {
				value: true,
				icon: 'info',
				label: 'A custom label',
			},
		} }
	>
		<h2>Column 1</h2>
	</PricingTableColumn>
	<PricingTableColumn
		values={ {
			numberOfShares: false,
			scheduling: false,
			socialChannels: true,
		} }
	>
		<h2>Column 2</h2>
	</PricingTableColumn>
</PricingTable>; */}

// <PricingTable items={ items } columns={ columns } />;

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

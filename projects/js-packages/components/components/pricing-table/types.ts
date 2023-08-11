import type { Placement } from '../icon-tooltip/types';

export type PricingTableProps = {
	/**
	 * Title of the pricing table.
	 */
	title: string;

	/**
	 * Array of items to display in the pricing table.
	 */
	items: {
		name: string;
		tooltipInfo?: React.ReactNode;
		tooltipTitle?: string;
		tooltipPlacement?: Placement;
	}[];

	/**
	 * The columns to add to the table.
	 */
	children: React.ReactNode;

	/**
	 * Whether to show the intro offer disclaimer text with the ToS.
	 */
	showIntroOfferDisclaimer?: boolean;
};

export type PricingTableColumnProps = {
	/**
	 * Whether the column has the primary style.
	 */
	primary?: boolean;

	/**
	 * Items to show in a column.
	 */
	children: React.ReactElement[];
};

export type PricingTableHeaderProps = {
	/**
	 * Items to show in a header.
	 */
	children: React.ReactNode;
};

export type PricingTableItemProps = {
	/**
	 * Whether or not the item is included in the column.
	 */
	isIncluded: boolean;

	/**
	 * Whether the feature is coming soon. Takes precedence over isIncluded.
	 */
	isComingSoon?: boolean;

	/**
	 * A custom label to display instead of the default one.
	 */
	label?: string | number | React.ReactElement;

	/**
	 * Index of the item, relative to other PricingTableItem components. Internal use only.
	 */
	index?: number;

	/*
	 * If the item has more description a popover info can contain that.
	 */
	tooltipInfo?: React.ReactNode;

	/**
	 * Title for the popover, not required.
	 */
	tooltipTitle?: string;

	/**
	 * Class name for the popover, not required.
	 */
	tooltipClassName?: string;
};

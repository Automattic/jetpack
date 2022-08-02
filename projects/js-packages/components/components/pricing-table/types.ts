import { ReactElement } from 'react';

export type PricingTableProps = {
	/**
	 * Title of the pricing table.
	 */
	title: string;

	/**
	 * Headers for each column in the table.
	 */
	headers: React.ReactElement[];

	/**
	 * Values for the pricing table.
	 *
	 * Each item in the array is a row in the table.
	 */
	table: {
		label: string;
		values: ( boolean | { value: boolean; label: string | ReactElement } )[];
	}[];
};

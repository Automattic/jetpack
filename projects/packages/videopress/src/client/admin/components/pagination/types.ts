export type PaginationProps = {
	/**
	 * Optional classname to apply to the root element.
	 */
	className?: string;

	/**
	 * The current page number.
	 */
	currentPage: number;

	/**
	 * Number of records per page.
	 */
	perPage: number;

	/**
	 * Total number of records.
	 */
	total: number;

	/**
	 * The minimum number of columns to display pages and ellipses.
	 */
	minColumns?: number;

	/**
	 * Whether or not the component is on disabled state.
	 */
	disabled?: boolean;

	/**
	 * Callback to be invoked when a page is selected.
	 */
	onChangePage?: ( newPage: number ) => void;
};

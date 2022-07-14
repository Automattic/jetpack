type ColSpan = number | { start: number; end: number };

export type ColProps = {
	/**
	 * Custom className to be inserted.
	 */
	className?: string;

	/**
	 * Colspan for small viewport. Needs to be an integer.
	 */
	sm?: ColSpan;

	/**
	 * Colstart for medium viewport. Needs to be an integer.
	 */
	md?: ColSpan;

	/**
	 * Colstart for large viewport. Needs to be an integer.
	 */
	lg?: ColSpan;

	/**
	 * Children to be inserted.
	 */
	children?: React.ReactNode;
};

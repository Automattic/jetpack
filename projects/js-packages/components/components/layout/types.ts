type ColSpan = number | { start: number; end: number };

export type ColProps = {
	/**
	 * Tag name of the column element.
	 */
	tagName?: string;

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

export type ContainerProps = {
	/**
	 * Tag name of the container.
	 */
	tagName?: string;

	/**
	 * Make container not having a max width.
	 */
	fluid?: boolean;

	/**
	 * Custom className to be inserted.
	 */
	className?: string;

	/**
	 * Number of spacing (top / bottom), it gets mutiplied by 8px. Needs to be an integer
	 */
	horizontalSpacing?: number;

	/**
	 * Number of gap betwen rows, it gets multipled by 8px. Needs to be an integer
	 */
	horizontalGap?: number;

	/**
	 * Children to be inserted.
	 */
	children?: React.ReactNode;
};

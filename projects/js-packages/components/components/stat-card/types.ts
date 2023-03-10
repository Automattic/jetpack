export type StatCardProps = {
	/**
	 * Custom className to be inserted.
	 */
	className?: string;

	/**
	 * The stat card icon.
	 */
	icon: JSX.Element;

	/**
	 * The stat label.
	 */
	label: string;

	/**
	 * The stat value.
	 */
	value: number;

	/**
	 * The component variant.
	 *
	 * @default 'square'
	 */
	variant?: 'square' | 'horizontal';
};

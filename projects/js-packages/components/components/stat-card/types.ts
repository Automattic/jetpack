export type StatCardProps = {
	/**
	 * Custom className to be inserted.
	 */
	className?: string;

	/**
	 * Whether to hide the value.
	 */
	hideValue?: boolean;

	/**
	 * The stat card icon.
	 */
	icon: React.JSX.Element;

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

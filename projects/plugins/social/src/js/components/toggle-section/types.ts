export type ToggleSectionProps = {
	/**
	 * Title of the Toggle.
	 */
	title: string;

	/**
	 * Callback to be called when the toggle is clicked.
	 */
	onChange: () => void;

	/**
	 * Whether the toggle is checked.
	 */
	checked: boolean;

	/**
	 * Whether the toggle is disabled.
	 */
	disabled: boolean;

	/**
	 * Children to be rendered inside the toggle.
	 */
	children: React.ReactNode;
};

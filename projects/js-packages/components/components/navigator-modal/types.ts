export type TNavigatorModalContext = {
	/**
	 * Whether the modal is dismissible.
	 */
	isDismissible?: boolean;
	/**
	 * The initial active path.
	 */
	initialPath?: string;

	/**
	 * Callback fired when the close button is clicked.
	 */
	onClose?: VoidFunction;
};

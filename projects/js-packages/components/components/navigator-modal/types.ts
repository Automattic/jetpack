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

export type SharedProps = {
	/**
	 * The content of the component.
	 */
	children: React.ReactNode;

	/**
	 * className to be applied to the modal.
	 */
	className?: string;
};

export type VideoUploadAreaProps = {
	/**
	 * Optional classname to apply to the root element.
	 */
	className?: string;

	/**
	 * Callback to be invoked when files are selected.
	 */
	onSelectFiles: ( files: File[] ) => void;
};

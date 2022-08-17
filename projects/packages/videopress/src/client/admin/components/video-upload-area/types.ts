export type VideoUploadAreaProps = {
	/**
	 * Whether or not the component is on loading state.
	 */
	isLoading?: boolean;
	/**
	 * A className to be concat with default ones.
	 */
	className?: string;
	/**
	 * A className to be concat with default ones.
	 */
	onSelectFiles: ( files: File[] ) => void;
};

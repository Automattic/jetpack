export type ThemeProviderProps = {
	/**
	 * An optional id to register and identify the provider instance.
	 */
	id?: string;

	/**
	 * Target DOM element to store theme styles. Optional.
	 */
	targetDom?: HTMLElement;

	/**
	 * Content
	 */
	children?: React.ReactElement;
	/**
	 * Inser global/reset styles
	 */
	withGlobalStyles?: boolean;
};

export type ThemeInstance = {
	provided: boolean;
	root: HTMLElement;
};

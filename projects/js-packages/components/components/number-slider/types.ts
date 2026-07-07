export type NumberSliderProps = {
	/**
	 * The wrapper class name of this NumberSlider component.
	 */
	className?: string;

	/**
	 * Whether the slider is disabled (non-interactive).
	 */
	disabled?: boolean;

	/**
	 * The maximum value of the slider.
	 */
	maxValue?: number;

	/**
	 * The minimum value of the slider.
	 */
	minValue?: number;

	/**
	 * The initial value of the slider.
	 */
	value?: number;

	/**
	 * The step value of the slider.
	 */
	step?: number;

	/**
	 * Callback called on every value change while dragging.
	 * The function will be called with the new value.
	 */
	onChange?: ( value: number ) => void;

	/**
	 * Callback called only after moving the thumb has ended.
	 * The function will be called with the result value.
	 */
	onAfterChange?: ( value: number ) => void;
};

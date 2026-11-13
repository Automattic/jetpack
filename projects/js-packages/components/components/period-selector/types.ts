export type PeriodPreset< Value extends string = string > = {
	/** Identifies the preset; passed to `onChange`. */
	value: Value;
	/** The preset's name, such as "Last 7 days". */
	label: string;
};

export type PeriodSelectorProps< Value extends string = string > = {
	/** The presets the dropdown offers, in order. */
	presets: PeriodPreset< Value >[];
	/** Names what the control picks, such as "Date range"; screen readers hear it before the selected period. */
	label?: string;
	/** The selected preset's value. */
	value: Value;
	/** Called with the chosen preset's value. */
	onChange: ( value: Value ) => void;
	/** Steps to the previous period; the button shows only when set. */
	onPrevious?: () => void;
	/** Steps to the next period; the button shows only when set. */
	onNext?: () => void;
	/** Whether there is no previous period to step to. */
	isPreviousDisabled?: boolean;
	/** Whether there is no next period to step to, such as on the latest one. */
	isNextDisabled?: boolean;
	/** Whether the dropdown and both step buttons are disabled. */
	disabled?: boolean;
	/** Class name for the wrapper. */
	className?: string;
};

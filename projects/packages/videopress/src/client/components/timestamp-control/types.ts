export type TimestampInputProps = {
	disabled?: boolean;
	value: number;
	max?: number;
	fineAdjustment?: number;
	onChange?: ( ms: number ) => void;
	autoHideTimeInputs?: boolean;
};

export type TimestampControlProps = TimestampInputProps & {
	wait?: number;
	onDebounceChange?: ( ms: number ) => void;
};

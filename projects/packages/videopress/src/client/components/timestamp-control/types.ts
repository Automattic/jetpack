export type TimestampInputProps = {
	disabled?: boolean;
	value: number;
	max?: number;
	fineAdjustment?: number;
	onChange?: ( ms: number ) => void;
};

export type TimestampControlProps = TimestampInputProps & {
	wait?: number;
	onDebounceChange?: ( ms: number ) => void;
};

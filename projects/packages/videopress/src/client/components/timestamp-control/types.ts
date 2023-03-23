export type DecimalPlacesProp = 1 | 2 | 3;

export type TimestampInputProps = {
	disabled?: boolean;
	value: number;
	max?: number;
	fineAdjustment?: number;
	onChange?: ( ms: number ) => void;
	autoHideTimeInput?: boolean;
	decimalPlaces?: DecimalPlacesProp;
};

export type TimestampControlProps = TimestampInputProps & {
	wait?: number;
	onDebounceChange?: ( ms: number ) => void;
};

/*
 * Types
 */
import type { ReactNode } from 'react';

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
	label?: ReactNode;
	help?: ReactNode;
	wait?: number;
	onDebounceChange?: ( ms: number ) => void;
};

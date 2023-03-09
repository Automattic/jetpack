export type TimestampInputProps = {
	value: number;
	max?: number;
	onChange: ( ms: number ) => void;
};

export type TimestampControlProps = TimestampInputProps;

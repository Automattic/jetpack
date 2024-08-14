export type ValidationErrors = Record< string, string >;

export type MediaRestrictions = {
	validationErrors: ValidationErrors;
	isConvertible: boolean;
};

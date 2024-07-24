export type ValidationErrors = Record< string, string >;

export type MediaRestrictionsOptions = {
	isSocialImageGeneratorEnabledForPost: boolean;
};

export type MediaRestrictions = {
	validationErrors: ValidationErrors;
	isConvertible: boolean;
};

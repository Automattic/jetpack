export type Viewport = {
	width: number;
	height: number;
};

export type NullableViewport = Viewport | { width: null; height: null };

export type PropertiesFilter = ( name: string, value: string ) => boolean;
export type AtRuleFilter = ( name: string ) => boolean;

export type FilterSpec = {
	properties?: PropertiesFilter;
	atRules?: AtRuleFilter;
};

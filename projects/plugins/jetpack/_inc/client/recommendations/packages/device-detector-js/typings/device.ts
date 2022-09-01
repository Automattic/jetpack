export type DeviceType =
	| ''
	| 'desktop'
	| 'smartphone'
	| 'tablet'
	| 'smart display'
	| 'phablet'
	| 'feature phone';

export interface GenericMobileResult {
	type: DeviceType;
	brand: string;
	model: string;
}

export type DeviceType =
	| ''
	| 'desktop'
	| 'smartphone'
	| 'tablet'
	| 'smart display'
	| 'camera'
	| 'car'
	| 'portable media player'
	| 'phablet'
	| 'wearable'
	| 'smart speaker'
	| 'feature phone'
	| 'peripheral';

export interface GenericMobileResult {
	type: DeviceType;
	brand: string;
	model: string;
}

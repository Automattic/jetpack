export type DeviceType =
	| ''
	| 'desktop'
	| 'smartphone'
	| 'tablet'
	| 'smart display'
	| 'car'
	| 'phablet'
	| 'wearable'
	| 'smart speaker'
	| 'feature phone'
	| 'peripheral';

export interface GenericDeviceResult {
	type: DeviceType;
	brand: string;
}

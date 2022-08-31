export type DeviceType =
	| ''
	| 'desktop'
	| 'smartphone'
	| 'tablet'
	| 'television'
	| 'smart display'
	| 'camera'
	| 'car'
	| 'console'
	| 'portable media player'
	| 'phablet'
	| 'wearable'
	| 'smart speaker'
	| 'feature phone'
	| 'peripheral';

export interface GenericDeviceResult {
	type: DeviceType;
	brand: string;
	model: string;
}

import { FEATURES } from '../constants';

export function setBusy( isBusy: boolean ) {
	return {
		type: 'SET_BUSY',
		isBusy,
	};
}

export function setTitleBusy( isBusy: boolean ) {
	return {
		type: 'SET_TITLE_BUSY',
		isBusy,
	};
}

export function setDescriptionBusy( isBusy: boolean ) {
	return {
		type: 'SET_DESCRIPTION_BUSY',
		isBusy,
	};
}

export function setIsTogglingAutoEnhance( isToggling: boolean ) {
	return {
		type: 'SET_IS_TOGGLING_AUTO_ENHANCE',
		isToggling,
	};
}

export function setIsAutoEnhanceEnabled( isEnabled: boolean ) {
	return {
		type: 'SET_IS_AUTO_ENHANCE_ENABLED',
		isEnabled,
	};
}

export function setImageBusy( clientId: string, isBusy: boolean ) {
	return {
		type: 'SET_IMAGE_BUSY',
		clientId,
		isBusy,
	};
}

export function setImageFailed( clientId: string, failed: boolean ) {
	return {
		type: 'SET_IMAGE_FAILED',
		clientId,
		failed,
	};
}

export function setFeatureEnabled( feature: ( typeof FEATURES )[ number ], enabled: boolean ) {
	return {
		type: 'SET_FEATURE_ENABLED',
		feature,
		enabled,
	};
}

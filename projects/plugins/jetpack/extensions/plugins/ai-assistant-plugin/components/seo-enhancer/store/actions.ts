export function setBusy( isBusy: boolean ) {
	return {
		type: 'SET_BUSY',
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

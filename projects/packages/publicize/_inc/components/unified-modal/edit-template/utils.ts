import { LocalState } from './types';

export const getLocalImageType = (
	featuredImageId: number,
	defaultImageId: number
): LocalState[ 'imageType' ] => {
	if ( ! featuredImageId && defaultImageId ) {
		return 'default';
	}

	return 'featured';
};

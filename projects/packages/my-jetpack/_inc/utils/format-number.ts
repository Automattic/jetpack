import { numberFormat } from '@automattic/jetpack-components';
import type { FormatNumberFunction } from './types';

const defaultConfig: Intl.NumberFormatOptions = {
	maximumFractionDigits: 1,
	notation: 'compact',
};

const formatNumber: FormatNumberFunction = ( number, config = defaultConfig ) => {
	if ( number === null || ! Number.isFinite( number ) ) {
		return '-';
	}

	return numberFormat( number, config );
};

export default formatNumber;

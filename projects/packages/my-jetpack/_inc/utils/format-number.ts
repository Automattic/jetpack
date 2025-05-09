import { formatNumber as formatNumberFromLib } from '@automattic/number-formatters';
import type { FormatNumberFunction } from './types';

const defaultConfig: Intl.NumberFormatOptions = {
	maximumFractionDigits: 1,
	notation: 'compact',
};

const formatNumber: FormatNumberFunction = ( number, config = defaultConfig ) => {
	if ( number === null || ! Number.isFinite( number ) ) {
		return '-';
	}

	return formatNumberFromLib( number, { numberFormatOptions: config } );
};

export default formatNumber;

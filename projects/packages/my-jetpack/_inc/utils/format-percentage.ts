import { numberFormat } from '@automattic/jetpack-components';
import type { FormatNumberFunction } from './types';

const defaultConfig: Intl.NumberFormatOptions = {
	style: 'percent',
};

const formatPercentage: FormatNumberFunction = ( number, config = defaultConfig ) => {
	// Force percentage
	config.style = 'percent';

	if ( number === null || ! Number.isFinite( number ) ) {
		return '-';
	}

	return numberFormat( number, config );
};

export default formatPercentage;

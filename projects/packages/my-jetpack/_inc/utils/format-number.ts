import { numberFormat } from '@automattic/jetpack-components';

type FormatNumberFunction = ( number: number, config?: Intl.NumberFormatOptions ) => string;

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

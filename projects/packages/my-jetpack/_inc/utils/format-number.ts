import { numberFormat } from '@automattic/jetpack-components';

type FormatNumberFunction = ( number: number, config: Intl.NumberFormatOptions ) => string;

const formatNumber: FormatNumberFunction = ( number, config = {} ) => {
	if ( number === null || ! Number.isFinite( number ) ) {
		return '-';
	}

	return numberFormat( number, config );
};

export default formatNumber;

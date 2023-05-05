import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { isArray, isEmpty, join } from 'lodash';

export const getDisplayName = response => {
	if ( response.author_name ) {
		return response.author_name;
	}

	if ( response.author_email ) {
		return response.author_email;
	}

	return response.ip;
};

export const getPath = response => {
	try {
		const url = new URL( response.entry_permalink );
		return url.pathname;
	} catch ( error ) {
		return '';
	}
};

export const formatFieldName = fieldName => {
	const match = fieldName.match( /^(\d+_)?(.*)/i );

	if ( match ) {
		return match[ 2 ];
	}

	return fieldName;
};

export const formatFieldValue = fieldValue => {
	if ( isEmpty( fieldValue ) ) {
		return '-';
	} else if ( isArray( fieldValue ) ) {
		return join( fieldValue, ', ' );
	}

	return fieldValue;
};

export const isWpcom = () => isAtomicSite() || isSimpleSite();

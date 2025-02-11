import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Icon } from '@wordpress/components';
import { upload } from '@wordpress/icons';
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
	} catch {
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

	if ( fieldValue.startsWith( '{' ) ) {
		const fieldValueObj = JSON.parse( fieldValue );
		if ( fieldValueObj.field_type === 'file' ) {
			return (
				<>
					<Icon icon={ upload } />
					<a href={ fieldValueObj.url } target="_blank" rel="noopener noreferrer">
						{ fieldValueObj.name }
					</a>
				</>
			);
		}
	}

	return fieldValue;
};

export const isWpcom = () => isAtomicSite() || isSimpleSite();

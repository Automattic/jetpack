import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Icon, upload } from '@wordpress/icons';
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
	if ( fieldValue.name && fieldValue.url ) {
		return (
			<span className="file-field">
				<Icon icon={ upload } />
				<a href={ fieldValue.url } target="_blank" rel="noopener noreferrer">
					{ fieldValue.name }
				</a>
			</span>
		);
	} else if ( isEmpty( fieldValue ) ) {
		return '-';
	} else if ( isArray( fieldValue ) ) {
		return join( fieldValue, ', ' );
	}

	return fieldValue;
};

export const isWpcom = () => isAtomicSite() || isSimpleSite();

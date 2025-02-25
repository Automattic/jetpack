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

	try {
		const parsedValue = JSON.parse( fieldValue );
		if ( parsedValue.file_id ) {
			return (
				<span className="file-field">
					<Icon icon={ upload } />
					<a href={ parsedValue.url } target="_blank" rel="noopener noreferrer">
						{ parsedValue.name }
					</a>
				</span>
			);
		}
	} catch {
		// Do nothing
	}
	return fieldValue;
};

export const isWpcom = () => isAtomicSite() || isSimpleSite();

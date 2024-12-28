import { View } from '@wordpress/dataviews';

export const getFilterValues = ( currentView: View, field: string ) => {
	const filter = ( currentView?.filters || [] )?.find( f => f.field === field );
	if ( ! filter ) {
		return [];
	}
	return Array.isArray( filter.value ) ? filter.value : [ filter.value ];
};

import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const minifyMetaOptions = [ 'minify_js_excludes', 'minify_css_excludes' ] as const;

type MinifyMetaKeys = ( typeof minifyMetaOptions )[ number ];

export interface Props {
	datasyncKey: MinifyMetaKeys;
	inputLabel: string;
	buttonText: string;
	placeholder: string;
}

export const useMetaQuery = ( key: MinifyMetaKeys ) => {
	const [ { data }, { mutate } ] = useDataSync( 'jetpack_boost_ds', key, z.array( z.string() ) );

	function updateValues( text: string ) {
		mutate( text.split( ',' ).map( item => item.trim() ) );
	}

	return [ data || [], updateValues ] as const;
};

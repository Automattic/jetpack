import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const minifyMetaOptions = [ 'minify_js_excludes', 'minify_css_excludes' ] as const;

type MinifyMetaKeys = ( typeof minifyMetaOptions )[ number ];

export interface Props {
	datasyncKey: MinifyMetaKeys;
	buttonText: string;
	placeholder: string;
}

export const useMetaQuery = ( key: MinifyMetaKeys, onSuccess?: ( newState: string[] ) => void ) => {
	const [ { data }, { mutate } ] = useDataSync( 'jetpack_boost_ds', key, z.array( z.string() ) );

	function updateValues( text: string ) {
		mutate(
			text.split( ',' ).map( item => item.trim() ),
			{
				onSuccess: newState => {
					// Run the passed on callbacks after the mutation has been applied
					onSuccess?.( newState );
				},
			}
		);
	}

	return [ data || [], updateValues ] as const;
};

export const useShowMinifyLegacy = () => {
	const [ query ] = useDataSync( 'jetpack_boost_ds', 'minify_legacy_notice', z.boolean() );

	return query;
};

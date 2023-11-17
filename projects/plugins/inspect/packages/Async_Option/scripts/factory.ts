import AsyncAPI from './AsyncAPI';
import { Options } from './Options';
import type { AsyncOptions as AO } from './types';
import type { z } from 'zod';

/**
 *
 * @param key
 * @param parser
 */
export function getOptionsFromGlobal< T extends z.ZodTypeAny >(
	key: string,
	parser: T
): z.infer< T > {
	if ( ! ( key in window ) ) {
		// console.error( `Could not locate global variable ${ key }` );
		return false;
	}

	const obj = window[ key ];
	const result = parser.safeParse( obj );

	if ( ! result.success ) {
		// console.error( 'Error parsing options for', key, result.error );

		// @TODO: Maybe no options are found, return everything as false?
		// That way at least it's not a fatal?
		return false;
	}

	return result.data;
}

type valueChangedCallback = ( params: {
	// eslint-disable-next-line
	value: any;
	nonce: string;
} ) => Promise< typeof params.value >;

/**
 *
 * @param options
 * @param api
 */
function asyncOptionFactory< T extends AO.Options >( options: Options< T >, api: AsyncAPI ) {
	return function < K extends keyof T & string >(
		name: K,
		onValueChanged: valueChangedCallback | null = null
	) {
		const endpoint = name.replace( '_', '-' );

		if ( null === onValueChanged ) {
			onValueChanged = async ( { value, nonce } ) => {
				return await api.POST< typeof value >( endpoint, nonce, value );
			};
		}

		return options.createStore( name, onValueChanged );
	};
}

/**
 *
 * @param name
 * @param validator
 */
export function createAsyncFactory< T extends z.ZodTypeAny >( name: string, validator: T ) {
	const globals = getOptionsFromGlobal( name, validator );
	const options = new Options( globals );
	const endpoint = options.get( 'rest_api' );
	const api = new AsyncAPI( endpoint.value, endpoint.nonce );

	return {
		createStore: asyncOptionFactory( options, api ),
		api,
		options,
	};
}

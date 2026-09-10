/**
 * Internal dependencies
 */
import { StatsResponseShapeError } from '../../utils';
import { queryClient } from '../query-client-provider';

describe( 'query client response-shape diagnostics', () => {
	it( 'warns with the sanitizer detail for a response contract violation', () => {
		const warn = jest.spyOn( console, 'warn' ).mockImplementation();
		const query = queryClient.getQueryCache().build( queryClient, { queryKey: [ 'shape-test' ] } );

		queryClient
			.getQueryCache()
			.config.onError?.( new StatsResponseShapeError( 'Expected hour-of-day data' ), query );

		expect( warn ).toHaveBeenCalledWith( 'Unexpected Stats response: Expected hour-of-day data' );
		warn.mockRestore();
	} );
} );

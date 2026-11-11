/**
 * A promise that gives up after a while instead of waiting as long as its source does.
 *
 * @param pending - What is being waited on.
 * @param ms      - How long to wait for it.
 * @return The same result, or a rejection once the time is up.
 */
export function withLoadLimit< T >( pending: Promise< T >, ms: number ): Promise< T > {
	let timer: ReturnType< typeof setTimeout > | undefined;
	const limit = new Promise< never >( ( _, reject ) => {
		timer = setTimeout( () => reject( new Error( `Not loaded after ${ ms / 1000 }s.` ) ), ms );
	} );

	return Promise.race( [ pending, limit ] ).finally( () => clearTimeout( timer ) );
}

/**
 * External dependencies
 */
import React from 'react';

const translate = ( ...args ) => (
	<span
		// eslint-disable-next-line react/no-danger
		dangerouslySetInnerHTML={ {
			__html: `<?php echo esc_html__( ${ args.map( arg => `'${ arg }'` ).join( ', ' ) } ) ?>`,
		} }
	/>
);

export { translate as __, translate as _x, translate as _n, translate as _nx };

export const sprintf = x => x;

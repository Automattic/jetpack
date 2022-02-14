/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { Container, Col } from '@automattic/jetpack-components';
import styles from './style.module.scss';

const Placeholder = ( { rows, heights = [], cols = [] } ) => {
	const items = Array( rows ).fill( {} );

	return (
		<Container>
			{ items.map( ( _, i ) => (
				<Col
					{ ...( cols[ i ] ?? {} ) }
					styles={ { height: heights[ i ] } }
					key={ `placeholder-${ i }` }
					className={ styles.items }
				/>
			) ) }
		</Container>
	);
};

export default Placeholder;

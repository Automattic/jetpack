/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Container from '../container';
import Col from '../col';
import styles from './styles.module.scss';

const Layout = ( { items, fluid, horizontalGap, horizontalSpacing } ) => {
	return (
		<Container
			className={ styles.container }
			horizontalSpacing={ horizontalSpacing }
			fluid={ fluid }
			horizontalGap={ horizontalGap }
		>
			{ items.map( ( { sm, lg, md } ) => (
				<Col sm={ sm } md={ md } lg={ lg } className={ styles.col }>
					{ Number.isInteger( sm ) ? `sm=${ sm } ` : '' }
					{ Number.isInteger( md ) ? `md=${ md } ` : '' }
					{ Number.isInteger( lg ) ? `lg=${ lg } ` : '' }
				</Col>
			) ) }
			<Col>
				<Container fluid horizontalSpacing={ 0 } horizontalGap={ 1 }>
					<Col className={ styles.col }>Composition Example</Col>
					<Col className={ styles.col }>Composition Example</Col>
				</Container>
			</Col>
		</Container>
	);
};

export default {
	title: 'JS Packages/Components/Layout',
	component: Layout,
};

const Template = args => <Layout { ...args } />;
export const Default = Template.bind( {} );
Default.args = {
	fluid: false,
	horizontalSpacing: 10,
	horizontalGap: 5,
	items: [
		{
			sm: 2,
			md: 5,
			lg: 4,
		},
		{
			sm: 2,
			md: 3,
			lg: 8,
		},
		{
			sm: 2,
			md: 3,
			lg: 8,
		},
		{
			sm: 2,
			md: 5,
			lg: 4,
		},
		{
			sm: 2,
			md: 5,
			lg: 4,
		},
		{
			sm: 2,
			md: 3,
			lg: 8,
		},
	],
};

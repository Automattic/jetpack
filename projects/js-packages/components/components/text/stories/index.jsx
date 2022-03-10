/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
// import Col from '../../layout/col';
// import Container from '../../layout/container';
import Text from '../index.jsx';
import styles from './style.module.scss';

export default {
	title: 'JS Packages/Components/Text',
	component: Text,
};

export const Default = () => (
	<>
		<Text variant="title-large" className={ styles.heading }>
			Examples
		</Text>
		<Text variant="title-large">Title Large</Text>
		<Text variant="title-small">Title Small</Text>
		<Text variant="body">Body</Text>
		<Text variant="body-small">Body Small</Text>
		<Text variant="label">Label</Text>
	</>
);

const Custom = ( { className, children } ) => (
	<span className={ className }>{ children } Composition</span>
);

export const CustomComponent = () => (
	<>
		<Text variant="title-large" className={ styles.heading }>
			Examples
		</Text>
		<Text variant="title-small" component="div">
			Custom Tag
		</Text>
		<Text variant="body" component={ Custom }>
			Custom Component
		</Text>
	</>
);

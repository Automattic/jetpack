import { H3 } from '../index.tsx';
import styles from './style.module.scss';
import type { H3Props } from '../types.ts';
import type { Component } from 'react';

const TIPOGRAPHY_WEIGHTS: Array< H3Props[ 'weight' ] > = [ 'regular', 'bold' ];

export default {
	title: 'JS Packages/Components/Text/Heading',
	component: H3,
	parameters: {
		docs: {
			description: {
				component:
					'**Deprecated:** Use `Text` from `@wordpress/ui` instead, with a `heading-*` variant.',
			},
		},
	},
	argTypes: {
		children: {
			control: { type: 'text' },
		},
		weight: {
			control: { type: 'select' },
			options: TIPOGRAPHY_WEIGHTS,
		},
	},
};

/**
 * Helper component to create a the story.
 *
 * @param {object}    props          - Component props.
 * @param {Component} props.children - Icon component children.
 * @return {Component}                Text component instance.
 */
function Instance( { children } ) {
	return (
		<div className={ styles.instance }>
			<span>Text above to the the component...</span>
			{ children }
			<span>Text below to the the component...</span>
		</div>
	);
}

const TemplateH3 = args => (
	<Instance>
		<H3 { ...args }>
			{ args?.children ||
				'Headline Small - Manage your Jetpack plan and products all in one place' }
		</H3>
	</Instance>
);

export const HeadlineH3 = TemplateH3.bind( {} );
HeadlineH3.storyName = 'H3';
HeadlineH3.args = {
	weight: 'bold',
} as H3Props;

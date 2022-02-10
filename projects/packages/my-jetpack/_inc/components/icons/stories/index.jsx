/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import * as allIcons from '../index.jsx';
import styles from './style.module.scss';

export default {
	title: 'Packages/My Jetpack/Icons',
	component: allIcons,
	parameters: {},
};

const sizes = [
	{
		label: 'small',
		value: '24',
	},
	{
		label: 'medium',
		value: '48',
	},
	{
		label: 'large',
		value: '72',
	},
];

/**
 * Icons story components.
 *
 * @returns {object} - story component
 */
function IconsStory() {
	return (
		<div>
			{ sizes.map( size => (
				<div key={ size.label }>
					<h3>{ size.label }</h3>
					<div className={ styles[ 'icons-container' ] }>
						{ Object.keys( allIcons ).map( key => {
							const Icon = allIcons[ key ];
							return (
								<div
									className={ `${ styles[ 'icon-wrapper' ] } ${ styles[ size.label ] }` }
									key={ key }
								>
									<Icon size={ size.value } />
									<span>{ Icon.displayName }</span>
								</div>
							);
						} ) }
					</div>
				</div>
			) ) }
		</div>
	);
}

const Template = args => <IconsStory { ...args } />;

const DefaultArgs = {};
export const Default = Template.bind( {} );
Default.args = DefaultArgs;

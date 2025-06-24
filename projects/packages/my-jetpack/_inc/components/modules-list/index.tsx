import { Flex, Tooltip } from '@wordpress/components';
import { DataViews, Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { ModuleStatus } from '../module-status';
import { ModuleToggle } from '../module-toggle';
import { MyJetpackModule } from '../types';
import styles from './styles.module.scss';

import './style.scss';

export type ModulesListProps = {
	modules: Array< MyJetpackModule >;
};

const noop = () => {};

const getItemId = ( item: MyJetpackModule ) => item.module;

/**
 * Renders a list of Jetpack modules using the DataViews component.
 *
 * @param {ModulesListProps} props - The component props.
 *
 * @return The rendered component.
 */
export function ModulesList( { modules }: ModulesListProps ) {
	const fields = useMemo< Array< Field< MyJetpackModule > > >( () => {
		return [
			{
				id: 'title',
				label: __( 'Title', 'jetpack-my-jetpack' ),
				getValue( { item } ) {
					return item.name;
				},
				render( { item } ) {
					return (
						<Tooltip text={ item.description } className={ styles[ 'module-tooltip' ] }>
							<span>{ item.name }</span>
						</Tooltip>
					);
				},
			},
			{
				id: 'toggle',
				label: __( 'Toggle', 'jetpack-my-jetpack' ),
				render: ( { item } ) => {
					return (
						<Flex gap={ 4 } className={ styles[ 'toggle-wrap' ] }>
							<ModuleStatus module={ item } />
							<ModuleToggle module={ item } />
						</Flex>
					);
				},
			},
		];
	}, [] );

	return (
		<div className={ styles.wrapper }>
			<DataViews
				data={ modules }
				fields={ fields }
				view={ {
					type: 'table',
					titleField: 'title',
					fields: [ 'toggle' ],
				} }
				getItemId={ getItemId }
				paginationInfo={ {
					totalItems: modules.length,
					totalPages: 1,
				} }
				onChangeView={ noop }
				defaultLayouts={ { table: {} } }
			/>
		</div>
	);
}

import { Flex } from '@wordpress/components';
import { DataViews, Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import { useId, useMemo } from 'react';
import { MyJetpackModule } from '../../types';
import { ModuleStatus } from '../module-status';
import { ModuleToggle } from '../module-toggle';
import styles from './styles.module.scss';
import { getModuleStatus } from './utils';

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
	const baseId = useId();

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
						<div className={ styles[ 'module-title-wrapper' ] }>
							<span className={ styles[ 'module-name' ] }>{ item.name }</span>
							<span
								id={ `${ baseId }-description-${ item.module }` }
								className={ styles[ 'module-description' ] }
							>
								{ item.description }
							</span>
						</div>
					);
				},
			},
			{
				id: 'toggle',
				label: __( 'Toggle', 'jetpack-my-jetpack' ),
				render: ( { item } ) => {
					const { isAvailable, reason } = getModuleStatus( item );

					return ! isAvailable ? (
						<Badge intent="medium">{ reason }</Badge>
					) : (
						<Flex gap={ 4 } className={ styles[ 'toggle-wrap' ] }>
							<ModuleStatus module={ item } />
							<ModuleToggle
								module={ item }
								describedby={ `${ baseId }-description-${ item.module }` }
							/>
						</Flex>
					);
				},
			},
		];
	}, [ baseId ] );

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

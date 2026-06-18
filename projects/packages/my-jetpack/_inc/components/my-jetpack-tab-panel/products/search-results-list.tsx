import { Flex } from '@wordpress/components';
import { DataViews, Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import { useId, useMemo } from 'react';
import { ModuleStatus } from '../../module-status';
import { ModuleToggle } from '../../module-toggle';
import modulesStyles from '../../modules-list/styles.module.scss';
import { getModuleStatus } from '../../modules-list/utils';
import { ProductCardAction } from './product-card-action';
import { SearchResultItem } from './types';
import { getProductStatus } from './utils';

import '../../modules-list/style.scss';

export type SearchResultsListProps = {
	items: Array< SearchResultItem >;
};

const noop = () => {};

const getItemId = ( item: SearchResultItem ) =>
	item.kind === 'card' ? `card:${ item.card.product.slug }` : `module:${ item.module.module }`;

const getName = ( item: SearchResultItem ) =>
	item.kind === 'card' ? item.card.product.name : item.module.name;

const getDescription = ( item: SearchResultItem ) =>
	item.kind === 'card' ? item.card.product.description : item.module.description;

/**
 * Renders relevance-ranked search results as a single uniform list of compact rows, mixing
 * product cards and modules so the best match leads regardless of its type.
 *
 * @param {SearchResultsListProps} props - The component props.
 *
 * @return The rendered component.
 */
export function SearchResultsList( { items }: SearchResultsListProps ) {
	const baseId = useId();

	const fields = useMemo< Array< Field< SearchResultItem > > >( () => {
		return [
			{
				id: 'title',
				label: __( 'Title', 'jetpack-my-jetpack' ),
				getValue( { item } ) {
					return getName( item );
				},
				render( { item } ) {
					return (
						<div className={ modulesStyles[ 'module-title-wrapper' ] }>
							<span className={ modulesStyles[ 'module-name' ] }>{ getName( item ) }</span>
							<span
								id={ `${ baseId }-description-${ getItemId( item ) }` }
								className={ modulesStyles[ 'module-description' ] }
							>
								{ getDescription( item ) }
							</span>
						</div>
					);
				},
			},
			{
				id: 'action',
				label: __( 'Action', 'jetpack-my-jetpack' ),
				render: ( { item } ) => {
					const { isAvailable, reason } =
						item.kind === 'card'
							? getProductStatus( item.card.product )
							: getModuleStatus( item.module );

					if ( ! isAvailable ) {
						return <Badge intent="medium">{ reason }</Badge>;
					}

					return item.kind === 'card' ? (
						<Flex justify="end" className={ modulesStyles[ 'toggle-wrap' ] }>
							<ProductCardAction product={ item.card.product } module={ item.card.module } />
						</Flex>
					) : (
						<Flex gap={ 4 } className={ modulesStyles[ 'toggle-wrap' ] }>
							<ModuleStatus module={ item.module } />
							<ModuleToggle
								module={ item.module }
								describedby={ `${ baseId }-description-${ getItemId( item ) }` }
							/>
						</Flex>
					);
				},
			},
		];
	}, [ baseId ] );

	return (
		<div className={ modulesStyles.wrapper }>
			<DataViews
				data={ items }
				fields={ fields }
				view={ {
					type: 'table',
					titleField: 'title',
					fields: [ 'action' ],
				} }
				getItemId={ getItemId }
				paginationInfo={ {
					totalItems: items.length,
					totalPages: 1,
				} }
				onChangeView={ noop }
				defaultLayouts={ { table: {} } }
			/>
		</div>
	);
}

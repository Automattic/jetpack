import { __ } from '@wordpress/i18n';
import { Icon, check, info, closeSmall } from '@wordpress/icons';
import classnames from 'classnames';
import {
	createContext,
	useContext,
	Children,
	cloneElement,
	PropsWithChildren,
	ReactElement,
} from 'react';
import React, { CSSProperties } from 'react';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import Text from '../text';
import styles from './styles.module.scss';
import {
	PricingTableProps,
	PricingTableColumnProps,
	PricingTableHeaderProps,
	PricingTableItemProps,
} from './types';

const PricingTableContext = createContext( undefined );

export const PricingTableItem: React.FC< PricingTableItemProps > = ( {
	isIncluded,
	index = 0,
	label = null,
} ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );
	const items = useContext( PricingTableContext );
	const rowLabel = items[ index ];
	let defaultLabel = isIncluded ? __( 'Included', 'jetpack' ) : __( 'Not included', 'jetpack' );
	defaultLabel = isLg ? defaultLabel : rowLabel;

	if ( ! isLg && ! isIncluded ) {
		return null;
	}

	return (
		<Text variant="body-small" className={ classnames( styles.item, styles.value ) }>
			<Icon
				className={ classnames(
					styles.icon,
					isIncluded ? styles[ 'icon-check' ] : styles[ 'icon-cross' ]
				) }
				size={ 32 }
				icon={ isIncluded ? check : closeSmall }
			/>
			{ label || defaultLabel }
		</Text>
	);
};

export const PricingTableHeader: React.FC< PricingTableHeaderProps > = ( { children } ) => (
	<div className={ styles.header }>{ children }</div>
);

export const PricingTableColumn: React.FC< PricingTableColumnProps > = ( { children } ) => {
	let index = 0;

	return (
		<div className={ styles.card }>
			{ Children.map( children, child => {
				const item = child as ReactElement<
					PropsWithChildren< PricingTableHeaderProps | PricingTableItemProps >
				>;

				if ( item.type === PricingTableItem ) {
					index++;
					return cloneElement( item, { index: index - 1 } );
				}

				return item;
			} ) }
		</div>
	);
};

const PricingTable: React.FC< PricingTableProps > = ( { title, items, children } ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );

	return (
		<PricingTableContext.Provider value={ items }>
			<div
				className={ classnames( styles.container, { [ styles[ 'is-viewport-large' ] ]: isLg } ) }
				style={
					{
						'--rows': items.length + 1,
						'--columns': Children.toArray( children ).length + 1,
					} as CSSProperties
				}
			>
				<div className={ styles.table }>
					<Text variant="headline-small">{ title }</Text>
					{ isLg &&
						items.map( ( item, i ) => (
							<Text
								variant="body-small"
								className={ classnames( styles.item, styles.label ) }
								key={ i }
							>
								<Icon className={ classnames( styles.icon ) } size={ 24 } icon={ info } />
								<strong>{ item }</strong>
							</Text>
						) ) }
					{ children }
				</div>
			</div>
		</PricingTableContext.Provider>
	);
};

export default PricingTable;

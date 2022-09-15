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
import { ToS } from '../../../connection';
import IconTooltip from '../icon-tooltip';
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
	tooltipInfo,
	tooltipTitle,
} ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );
	const items = useContext( PricingTableContext );
	const rowLabel = items[ index ];
	const includedLabel = __( 'Included', 'jetpack' );
	const notIncludedLabel = __( 'Not included', 'jetpack' );
	let defaultLabel = isIncluded ? includedLabel : notIncludedLabel;
	defaultLabel = isLg ? defaultLabel : rowLabel;

	if ( ! isLg && ! isIncluded && label === null ) {
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
			{ tooltipInfo && (
				<IconTooltip
					title={ tooltipTitle }
					iconClassName={ styles[ 'popover-icon' ] }
					className={ styles.popover }
					placement={ 'bottom-end' }
					iconSize={ 22 }
				>
					<Text>{ tooltipInfo }</Text>
				</IconTooltip>
			) }
		</Text>
	);
};

export const PricingTableHeader: React.FC< PricingTableHeaderProps > = ( { children } ) => (
	<div className={ styles.header }>{ children }</div>
);

export const PricingTableColumn: React.FC< PricingTableColumnProps > = ( {
	primary = false,
	children,
} ) => {
	let index = 0;

	return (
		<div className={ classnames( styles.card, { [ styles[ 'is-primary' ] ]: primary } ) }>
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
								<strong>{ item }</strong>
								<Icon className={ classnames( styles.icon ) } size={ 24 } icon={ info } />
							</Text>
						) ) }
					{ children }
				</div>
				<div className={ styles[ 'tos-container' ] }>
					<Text className={ styles.tos } variant="body-small">
						{ ToS }
					</Text>
				</div>
			</div>
		</PricingTableContext.Provider>
	);
};

export default PricingTable;

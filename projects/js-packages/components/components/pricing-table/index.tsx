import { __ } from '@wordpress/i18n';
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
	rowLabel,
	label = null,
} ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );
	let defaultLabel = isIncluded ? __( 'Included', 'jetpack' ) : __( 'Not included', 'jetpack' );
	defaultLabel = isLg ? defaultLabel : rowLabel;

	if ( ! isLg && ! isIncluded ) {
		return <></>;
	}

	return (
		<Text
			variant="body-small"
			data-check={ isIncluded }
			className={ classnames( styles.item, styles.value ) }
		>
			{ label || defaultLabel }
		</Text>
	);
};

export const PricingTableHeader: React.FC< PricingTableHeaderProps > = ( { children } ) => {
	const [ isSmall ] = useBreakpointMatch( 'lg', '<' );
	return (
		<div className={ classnames( styles.header, { [ styles[ 'is-viewport-small' ] ]: isSmall } ) }>
			{ children }
		</div>
	);
};

export const PricingTableColumn: React.FC< PricingTableColumnProps > = ( { children } ) => {
	const items = useContext( PricingTableContext );
	let index = 0;

	return (
		<div className={ styles.card }>
			{ Children.map( Children.toArray( children ), child => {
				const props: { rowLabel?: string } = {};
				const item = child as ReactElement<
					PropsWithChildren< PricingTableHeaderProps | PricingTableItemProps >
				>;

				if ( item.type === PricingTableItem ) {
					props.rowLabel = items[ index ];
					index++;
				}

				return cloneElement( item, { ...props } );
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
							</Text>
						) ) }
					{ children }
				</div>
			</div>
		</PricingTableContext.Provider>
	);
};

export default PricingTable;

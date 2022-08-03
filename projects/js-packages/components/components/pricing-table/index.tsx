import { Fragment, createContext, useContext, Children, cloneElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
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

const PricingTableContext = createContext();

const PricingTableItem: React.FC< PricingTableItemProps > = ( {
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

const PricingTableHeader: React.FC< PricingTableHeaderProps > = ( { children } ) => (
	<div className={ styles.header }>{ children }</div>
);

const PricingTableColumn: React.FC< PricingTableColumnProps > = ( { children } ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );
	const items = useContext( PricingTableContext );
	const Wrapper = isLg ? Fragment : 'div';
	const wrapperProps = ! isLg ? { className: styles.card } : {};
	let index = 0;

	return (
		<Wrapper { ...wrapperProps }>
			{ Children.map( Children.toArray( children ), child => {
				const props: { rowLabel?: string } = {};

				if ( child.type === PricingTableItem ) {
					props.rowLabel = items[ index ];
					index++;
				}

				return cloneElement( child, { ...props } );
			} ) }
		</Wrapper>
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

export { PricingTable, PricingTableColumn, PricingTableHeader, PricingTableItem };

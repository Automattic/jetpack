import { useBreakpointMatch, Text } from '@automattic/jetpack-components';
import { Fragment, createContext, useContext, Children, cloneElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import styles from './styles.module.scss';

const PricingTableContext = createContext();

const PricingTableItem = ( { isIncluded, rowLabel, label = null } ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );
	let defaultLabel = isIncluded
		? __( 'Included', 'jetpack-social' )
		: __( 'Not included', 'jetpack-social' );
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

const PricingTableHeader = ( { children } ) => <div className={ styles.header }>{ children }</div>;

const PricingTableColumn = ( { children } ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );
	const items = useContext( PricingTableContext );
	const Wrapper = isLg ? Fragment : 'div';
	const wrapperProps = ! isLg ? { className: styles.card } : {};
	let index = 0;

	return (
		<Wrapper { ...wrapperProps }>
			{ Children.map( Children.toArray( children ), child => {
				const props = {};

				if ( child.type === PricingTableItem ) {
					props.rowLabel = items[ index ];
					index++;
				}

				return cloneElement( child, { ...props } );
			} ) }
		</Wrapper>
	);
};

const PricingTable = ( { title, items, children } ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );

	return (
		<PricingTableContext.Provider value={ items }>
			<div
				className={ classnames( styles.container, { [ styles[ 'is-viewport-large' ] ]: isLg } ) }
				style={ { '--rows': items.length + 1, '--columns': children.length + 1 } }
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

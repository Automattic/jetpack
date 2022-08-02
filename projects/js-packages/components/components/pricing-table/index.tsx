import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import React, { CSSProperties } from 'react';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import Text from '../text';
import styles from './styles.module.scss';
import { PricingTableProps } from './types';

const PricingTable: React.FC< PricingTableProps > = ( { title, headers, table } ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );

	const labels = table.map( item => item.label );
	const values = table.map( item => item.values );

	const Card: React.FC< { header: React.ReactElement; i: number } > = ( { header, i } ) => {
		const Wrapper = isLg ? Fragment : 'div';

		return (
			<Wrapper className={ styles.card }>
				<div className={ styles.header }>{ header }</div>
				{ table.map( row => (
					<PricingTableValue label={ row.label } value={ row.values[ i ] } />
				) ) }
			</Wrapper>
		);
	};

	return (
		<div
			className={ classnames( styles.container, { [ styles[ 'is-viewport-large' ] ]: isLg } ) }
			style={ { '--rows': values.length + 1, '--columns': headers.length + 1 } as CSSProperties }
		>
			<div className={ styles.table }>
				<Text variant="headline-small">{ title }</Text>
				{ isLg &&
					labels.map( label => (
						<Text variant="body-small" className={ classnames( styles.item, styles.label ) }>
							<strong>{ label }</strong>
						</Text>
					) ) }
				{ headers.map( ( header, i ) => (
					<Card header={ header } i={ i } />
				) ) }
			</div>
		</div>
	);
};

export { PricingTable, PricingTableColumn };



// import { Fragment } from '@wordpress/element';
// import { __ } from '@wordpress/i18n';
// import classnames from 'classnames';
// import React, { CSSProperties } from 'react';
// import useBreakpointMatch from '../layout/use-breakpoint-match';
// import Text from '../text';
// import styles from './styles.module.scss';
// import { PricingTableProps } from './types';

// const PricingTableValue = ( { label, value } ) => {
// 	const [ isLg ] = useBreakpointMatch( 'lg' );

// 	const isIncluded = typeof value === 'object' ? value.value : value;

// 	if ( ! isLg && ! isIncluded ) {
// 		return <></>;
// 	}

// 	const customLabel = typeof value === 'object' ? value.label : null;
// 	const defaultLabel = isIncluded ? __( 'Included', 'jetpack' ) : __( 'Not included', 'jetpack' );

// 	label = isLg ? defaultLabel : label;

// 	return (
// 		<Text
// 			variant="body-small"
// 			data-check={ isIncluded }
// 			className={ classnames( styles.item, styles.value ) }
// 		>
// 			{ customLabel || label }
// 		</Text>
// 	);
// };

// const PricingTableColumn = ( { values, children } ) => {
// 	console.log( values );

// 	return children;
// };

// const PricingTable: React.FC< PricingTableProps > = ( { title, headers, table } ) => {
// 	const [ isLg ] = useBreakpointMatch( 'lg' );

// 	const labels = table.map( item => item.label );
// 	const values = table.map( item => item.values );

// 	const Card: React.FC< { header: React.ReactElement; i: number } > = ( { header, i } ) => {
// 		const Wrapper = isLg ? Fragment : 'div';

// 		return (
// 			<Wrapper className={ styles.card }>
// 				<div className={ styles.header }>{ header }</div>
// 				{ table.map( row => (
// 					<PricingTableValue label={ row.label } value={ row.values[ i ] } />
// 				) ) }
// 			</Wrapper>
// 		);
// 	};

// 	return (
// 		<div
// 			className={ classnames( styles.container, { [ styles[ 'is-viewport-large' ] ]: isLg } ) }
// 			style={ { '--rows': values.length + 1, '--columns': headers.length + 1 } as CSSProperties }
// 		>
// 			<div className={ styles.table }>
// 				<Text variant="headline-small">{ title }</Text>
// 				{ isLg &&
// 					labels.map( label => (
// 						<Text variant="body-small" className={ classnames( styles.item, styles.label ) }>
// 							<strong>{ label }</strong>
// 						</Text>
// 					) ) }
// 				{ headers.map( ( header, i ) => (
// 					<Card header={ header } i={ i } />
// 				) ) }
// 			</div>
// 		</div>
// 	);
// };

// export default PricingTable;

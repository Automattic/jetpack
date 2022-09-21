import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, check, closeSmall } from '@wordpress/icons';
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
import { getRedirectUrl } from '../../../components';
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

const ToS = createInterpolateElement(
	__(
		'By clicking the button above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
		'jetpack'
	),
	{
		tosLink: <a href={ getRedirectUrl( 'wpcom-tos' ) } rel="noopener noreferrer" target="_blank" />,
		shareDetailsLink: (
			<a
				href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
				rel="noopener noreferrer"
				target="_blank"
			/>
		),
	}
);

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
	const rowLabel = items[ index ].name;
	const defaultTooltipInfo = items[ index ].tooltipInfo;
	const defaultTooltipTitle = items[ index ].tooltipTitle;
	const includedLabel = __( 'Included', 'jetpack' );
	const notIncludedLabel = __( 'Not included', 'jetpack' );
	const showTooltip = tooltipInfo || ( ! isLg && defaultTooltipInfo );

	let defaultLabel = isIncluded ? includedLabel : notIncludedLabel;
	defaultLabel = isLg ? defaultLabel : rowLabel;

	if ( ! isLg && ! isIncluded && label === null ) {
		return null;
	}

	return (
		<div className={ classnames( styles.item, styles.value ) }>
			<Icon
				className={ classnames(
					styles.icon,
					isIncluded ? styles[ 'icon-check' ] : styles[ 'icon-cross' ]
				) }
				size={ 32 }
				icon={ isIncluded ? check : closeSmall }
			/>
			<Text variant="body-small">{ label || defaultLabel }</Text>
			{ showTooltip && (
				<IconTooltip
					title={ tooltipInfo ? tooltipTitle : defaultTooltipTitle }
					iconClassName={ styles[ 'popover-icon' ] }
					className={ styles.popover }
					placement={ 'bottom-end' }
					iconSize={ 22 }
				>
					<Text>{ tooltipInfo || defaultTooltipInfo }</Text>
				</IconTooltip>
			) }
		</div>
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
							<div
								className={ classnames( styles.item, {
									[ styles[ 'last-feature' ] ]: i === items.length - 1,
								} ) }
								key={ i }
							>
								<Text variant="body-small">
									<strong>{ item.name }</strong>
								</Text>
								{ item.tooltipInfo && (
									<IconTooltip
										title={ item.tooltipTitle }
										iconClassName={ styles[ 'popover-icon' ] }
										className={ styles.popover }
										placement={ 'bottom-end' }
										iconSize={ 22 }
									>
										<Text>{ item.tooltipInfo }</Text>
									</IconTooltip>
								) }
							</div>
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

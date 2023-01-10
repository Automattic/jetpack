import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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

const INCLUDED_TEXT = __( 'Included', 'jetpack' );
const NOT_INCLUDED_TEXT = __( 'Not included', 'jetpack' );

const PricingTableContext = createContext( undefined );

export const PricingTableItem: React.FC< PricingTableItemProps > = ( {
	isIncluded,
	index = 0,
	label = null,
	tooltipInfo,
	tooltipTitle,
} ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );
	const item = useContext( PricingTableContext )[ index ];

	const featureNameLabel = item.name;

	const defaultTooltipInfo = item.tooltipInfo;
	const defaultTooltipTitle = item.tooltipTitle;
	const showTooltip = tooltipInfo || ( ! isLg && defaultTooltipInfo );

	const includedLabel = isIncluded ? INCLUDED_TEXT : NOT_INCLUDED_TEXT;
	const smallIncludedLabel = isIncluded
		? featureNameLabel
		: sprintf(
				/* translators: Name of the current feature */
				__( '%s not included', 'jetpack' ),
				featureNameLabel
		  );

	const defaultLabel = isLg ? includedLabel : smallIncludedLabel;

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
					title={ tooltipTitle ? tooltipTitle : defaultTooltipTitle }
					iconClassName={ styles[ 'popover-icon' ] }
					className={ styles.popover }
					placement={ 'bottom-end' }
					iconSize={ 14 }
					offset={ 4 }
				>
					<Text variant="body-small">{ tooltipInfo || defaultTooltipInfo }</Text>
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

const PricingTable: React.FC< PricingTableProps > = ( {
	title,
	items,
	children,
	showIntroOfferDisclaimer = false,
} ) => {
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
										iconSize={ 14 }
										offset={ 4 }
									>
										<Text variant="body-small">{ item.tooltipInfo }</Text>
									</IconTooltip>
								) }
							</div>
						) ) }
					{ children }
				</div>
			</div>
			<div className={ styles[ 'tos-container' ] }>
				<div className={ styles.tos }>
					{ showIntroOfferDisclaimer && (
						<Text variant="body-small">
							{ __(
								'Reduced pricing is a limited offer for the first year and renews at regular price.',
								'jetpack'
							) }
						</Text>
					) }
					<Text variant="body-small">{ ToS }</Text>
				</div>
			</div>
		</PricingTableContext.Provider>
	);
};

export default PricingTable;

import { useViewportMatch } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check, closeSmall } from '@wordpress/icons';
import clsx from 'clsx';
import {
	createContext,
	useContext,
	Children,
	cloneElement,
	PropsWithChildren,
	ReactElement,
	CSSProperties,
} from 'react';
import IconTooltip from '../icon-tooltip/index.tsx';
import TermsOfService from '../terms-of-service/index.tsx';
import Text from '../text/index.tsx';
import styles from './styles.module.scss';
import {
	PricingTableProps,
	PricingTableColumnProps,
	PricingTableHeaderProps,
	PricingTableItemProps,
} from './types.ts';
import type { FC } from 'react';

const INCLUDED_TEXT = __( 'Included', 'jetpack-components' );
const NOT_INCLUDED_TEXT = __( 'Not included', 'jetpack-components' );
const COMING_SOON_TEXT = __( 'Coming soon', 'jetpack-components' );

const PricingTableContext = createContext( undefined );

const getItemLabels = ( isComingSoon, isIncluded, featureNameLabel ) => {
	if ( isComingSoon ) {
		return {
			lg: COMING_SOON_TEXT,
			// translators: %s: Name of the current feature
			default: sprintf( __( '%s coming soon', 'jetpack-components' ), featureNameLabel ),
		};
	}

	return {
		lg: isIncluded ? INCLUDED_TEXT : NOT_INCLUDED_TEXT,
		default: isIncluded
			? featureNameLabel
			: sprintf(
					/* translators: %s: Name of the current feature */
					__( '%s not included', 'jetpack-components' ),
					featureNameLabel
			  ),
	};
};

export const PricingTableItem: FC< PricingTableItemProps > = ( {
	isIncluded = false,
	isComingSoon = false,
	index = 0,
	label = null,
	tooltipInfo,
	tooltipTitle,
	tooltipClassName = '',
} ) => {
	const isLg = useViewportMatch( 'large' );
	const item = useContext( PricingTableContext )[ index ];
	const isExplicitlyEmpty = label === '';
	const showTick = isComingSoon || isIncluded;

	const featureNameLabel = item.name;

	const defaultTooltipInfo = item.tooltipInfo;
	const defaultTooltipTitle = item.tooltipTitle;
	const showTooltip = tooltipInfo || ( ! isLg && defaultTooltipInfo );

	const labels = getItemLabels( isComingSoon, isIncluded, featureNameLabel );

	const defaultLabel = isLg ? labels.lg : labels.default;

	// Handle explicitly empty items (when label is empty string)
	if ( isExplicitlyEmpty ) {
		return (
			<div className={ clsx( styles.item, styles.value, styles.empty ) }>
				{ /* No icon and no text for explicitly empty items */ }
			</div>
		);
	}

	return (
		<div className={ clsx( styles.item, styles.value ) }>
			<Icon
				className={ clsx(
					styles.icon,
					showTick ? styles[ 'icon-check' ] : styles[ 'icon-cross' ]
				) }
				size={ 32 }
				icon={ showTick ? check : closeSmall }
			/>
			<Text variant="body-small">{ label || defaultLabel }</Text>
			{ showTooltip && (
				<IconTooltip
					title={ tooltipTitle ? tooltipTitle : defaultTooltipTitle }
					iconClassName={ styles[ 'popover-icon' ] }
					className={ clsx( styles.popover, tooltipClassName ) }
					placement={ 'bottom-end' }
					iconSize={ 14 }
					offset={ 4 }
					wide={ Boolean( tooltipTitle && tooltipInfo ) }
					inline={ false }
					shift
				>
					<Text variant="body-small" component="div">
						{ tooltipInfo || defaultTooltipInfo }
					</Text>
				</IconTooltip>
			) }
		</div>
	);
};

export const PricingTableHeader: FC< PricingTableHeaderProps > = ( { title, children } ) => (
	<div className={ styles.headerContainer }>
		{ title && (
			<Text variant="headline-small" className={ styles.title }>
				{ title }
			</Text>
		) }
		<div className={ styles.header }>{ children }</div>
	</div>
);

export const PricingTableColumn: FC< PricingTableColumnProps > = ( {
	primary = false,
	children,
	className,
} ) => {
	let index = 0;

	return (
		<div className={ clsx( styles.card, { [ styles[ 'is-primary' ] ]: primary }, className ) }>
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

const PricingTable: FC< PricingTableProps > = ( {
	title,
	headerLogo,
	items,
	children,
	showIntroOfferDisclaimer = false,
} ) => {
	const isLg = useViewportMatch( 'large' );

	return (
		<PricingTableContext.Provider value={ items }>
			<div
				className={ clsx( styles.container, { [ styles[ 'is-viewport-large' ] ]: isLg } ) }
				style={
					{
						'--rows': items.length + 1,
						'--columns': Children.toArray( children ).length + 1,
					} as CSSProperties
				}
			>
				<div className={ styles.table }>
					<div>
						{ headerLogo && <div className={ styles[ 'header-logo' ] }>{ headerLogo }</div> }
						<Text variant="headline-small" className={ styles.tableTitle }>
							{ title }
						</Text>
					</div>
					{ isLg &&
						items.map( ( item, i ) => {
							// Skip rendering feature names that are empty
							if ( ! item.name ) {
								return (
									<div key={ i } className={ clsx( styles.item, styles.feature, styles.empty ) } />
								);
							}

							return (
								<div
									className={ clsx( styles.item, styles.feature, {
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
											placement={ item.tooltipPlacement ? item.tooltipPlacement : 'bottom-end' }
											iconSize={ 14 }
											offset={ 4 }
											wide={ Boolean( item.tooltipTitle && item.tooltipInfo ) }
											inline={ false }
											shift
										>
											<Text variant="body-small">{ item.tooltipInfo }</Text>
										</IconTooltip>
									) }
								</div>
							);
						} ) }
					{ children }
				</div>
			</div>
			<div className={ styles[ 'tos-container' ] }>
				<div className={ styles.tos }>
					{ showIntroOfferDisclaimer && (
						<Text variant="body-small">
							{ __(
								'Reduced pricing is a limited offer for the first year and renews at regular price.',
								'jetpack-components'
							) }
						</Text>
					) }
					<TermsOfService multipleButtons />
				</div>
			</div>
		</PricingTableContext.Provider>
	);
};

export default PricingTable;

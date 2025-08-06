import {
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
} from '@automattic/jetpack-components';
import { ReactNode } from 'react';
import styles from './styles.module.scss';

type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

export type PricingTableItemConfig = {
	name: string;
	tooltipInfo?: ReactNode;
	tooltipTitle?: string;
	tooltipPlacement?: Placement;
};

export type PricingColumnConfig = {
	header: ReactNode;
	primary?: boolean;
	items:
		| boolean[]
		| Array< {
				isIncluded: boolean;
				isComingSoon?: boolean;
				label?: string | number | ReactNode;
				tooltipInfo?: ReactNode;
				tooltipTitle?: string;
				tooltipClassName?: string;
		  } >;
};

export type ProductInterstitialV2Props = {
	title: string;
	items: PricingTableItemConfig[];
	columns: PricingColumnConfig[];
	showIntroOfferDisclaimer?: boolean;
};

const ProductInterstitialV2 = ( {
	title,
	items,
	columns,
	showIntroOfferDisclaimer = false,
}: ProductInterstitialV2Props ) => {
	return (
		<PricingTable
			title={ title }
			items={ items }
			showIntroOfferDisclaimer={ showIntroOfferDisclaimer }
		>
			{ columns.map( ( column, columnIndex ) => {
				const pricingItems = column.items.map( ( item, itemIndex ) => {
					if ( typeof item === 'boolean' ) {
						return <PricingTableItem key={ itemIndex } isIncluded={ item } />;
					}

					return (
						<PricingTableItem
							key={ itemIndex }
							isIncluded={ item.isIncluded }
							isComingSoon={ item.isComingSoon }
							label={ item.label }
							tooltipInfo={ item.tooltipInfo }
							tooltipTitle={ item.tooltipTitle }
							tooltipClassName={ item.tooltipClassName }
						/>
					);
				} );

				const columnClassName = column.primary
					? styles[ 'pricing-column-primary' ]
					: styles[ 'pricing-column-bordered' ];

				return (
					<PricingTableColumn
						key={ columnIndex }
						primary={ column.primary }
						className={ columnClassName }
					>
						{ [
							<PricingTableHeader key="header">{ column.header }</PricingTableHeader>,
							...pricingItems,
						] }
					</PricingTableColumn>
				);
			} ) }
		</PricingTable>
	);
};

export default ProductInterstitialV2;

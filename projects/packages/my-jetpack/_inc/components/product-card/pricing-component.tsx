import formatCurrency from '@automattic/format-currency';
import clsx from 'clsx';
import styles from './style.module.scss';
import usePricingData from './use-pricing-data';

const PriceComponent = ( { slug }: { slug: string } ) => {
	const { discountPrice, fullPrice, currencyCode } = usePricingData( slug );

	return (
		<div className={ styles.priceContainer }>
			{ discountPrice && (
				<span className={ clsx( styles.price ) }>
					{ formatCurrency( discountPrice, currencyCode ) }
				</span>
			) }
			<span className={ clsx( styles.price, discountPrice && styles.discounted ) }>
				{ formatCurrency( fullPrice, currencyCode ) }
			</span>
			<span className={ styles.term }>/month, billed yearly</span>
		</div>
	);
};

export default PriceComponent;

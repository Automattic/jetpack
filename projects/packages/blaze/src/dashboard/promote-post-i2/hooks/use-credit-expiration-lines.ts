import { formatCurrency } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import { ReactNode, useMemo } from 'react';
import { useLocale } from '../../compat/utils';

/**
 *
 * @param expires
 * @param shortText
 * @param locale
 */
function formatExpirationDate( expires: string, shortText: boolean, locale: string ): string {
	const date = new Date( expires );
	if ( isNaN( date.getTime() ) ) {
		return expires;
	}
	const dateStyle = shortText ? 'short' : 'long';
	return new Intl.DateTimeFormat( locale, { dateStyle } ).format( date );
}

/**
 * Custom hook to get formatted expiration lines for credits
 * @param sortedHistory
 * @param shortText
 */
export const useCreditExpirationLines = (
	sortedHistory: Array< { amount: number; expires: string } >,
	shortText: boolean
): ReactNode[] | null => {
	const locale = useLocale();

	return useMemo( () => {
		if ( ! sortedHistory || sortedHistory.length === 0 ) {
			return null;
		}

		if ( sortedHistory.length === 1 ) {
			const firstItem = sortedHistory[ 0 ];
			const firstDate = formatExpirationDate( firstItem.expires, shortText, locale );
			const firstAmount = formatCurrency( firstItem.amount, 'USD', { isSmallestUnit: true } );

			return [
				sprintf(
					/* translators: %(amount)s is the credit amount. %(firstDate)s is the date. */ __(
						'You have %(amount)s in credits expiring on %(firstDate)s.',
						'jetpack-blaze'
					),
					{ amount: firstAmount, firstDate }
				),
			];
		}

		const header = __( 'You have several credit assignations:', 'jetpack-blaze' );
		const items = sortedHistory.map( item => {
			const amount = formatCurrency( item.amount, 'USD', { isSmallestUnit: true } );
			const date = formatExpirationDate( item.expires, shortText, locale );
			return shortText
				? sprintf(
						/* translators: %(amount)s is the credit amount. %(date)s is the expiration date. */ __(
							'%(amount)s expiring on %(date)s',
							'jetpack-blaze'
						),
						{ amount, date }
					)
				: sprintf(
						/* translators: %(amount)s is the credit amount. %(date)s is the expiration date. */ __(
							'%(amount)s in credits expiring on %(date)s',
							'jetpack-blaze'
						),
						{ amount, date }
					);
		} );

		return [ header, ...items ];
	}, [ sortedHistory, shortText, locale ] );
};

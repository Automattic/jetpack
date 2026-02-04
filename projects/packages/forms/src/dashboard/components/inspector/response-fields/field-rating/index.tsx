/**
 * External dependencies
 */
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	VisuallyHidden,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { RatingIcon } from '../../../../../blocks/field-rating/rating-icon.jsx';
import { MAX_RATING_ICONS } from '../../../../../blocks/field-rating/rating-icons.js';

type FieldRatingProps = {
	value?: string | null;
};

const FieldRating = ( { value }: FieldRatingProps ) => {
	const stringValue = value != null ? String( value ) : '';
	if ( stringValue.trim() === '' ) {
		return '-';
	}
	const [ rateValue, outOf ] = stringValue.split( '/' ) ?? [];
	if ( ! rateValue || rateValue.trim() === '' ) {
		return '-';
	}
	if ( ! outOf || outOf.trim() === '' ) {
		return '-';
	}

	const rateValueTrimmed = rateValue.trim();
	const outOfTrimmed = outOf.trim();

	// Require strictly numeric values to reject partial matches like "4abc"
	if ( ! /^[0-9]+$/.test( rateValueTrimmed ) || ! /^[0-9]+$/.test( outOfTrimmed ) ) {
		return '-';
	}

	const parsedRating = Number.parseInt( rateValueTrimmed, 10 );
	const parsedMax = Number.parseInt( outOfTrimmed, 10 );
	if (
		! Number.isFinite( parsedRating ) ||
		parsedRating < 0 ||
		! Number.isFinite( parsedMax ) ||
		parsedMax < 0
	) {
		return '-';
	}

	// Clamp max to prevent DOM bloat from large values
	const clampedMax = Math.min( parsedMax, MAX_RATING_ICONS );
	const displayRating = Math.min( Math.max( 0, parsedRating ), clampedMax );

	const ratingLabel = sprintf(
		/* translators: 1: rating value, 2: maximum rating (e.g. "4" and "5" for "4 out of 5") */
		__( 'Rating %1$s out of %2$s', 'jetpack-forms' ),
		String( displayRating ),
		String( clampedMax )
	);

	return (
		<>
			<VisuallyHidden as="span">{ ratingLabel }</VisuallyHidden>
			<HStack spacing="1" alignment="topLeft">
				{ Array.from( { length: clampedMax }, ( _, index ) => (
					<span style={ { flex: '0 0 24px' } } key={ index }>
						<RatingIcon
							iconStyle="stars"
							strokeColor={ index < displayRating ? '#F0B849' : '#757575' }
							fillColor={ index < displayRating ? '#F0B849' : 'none' }
							strokeWidth={ 1.5 }
						/>
					</span>
				) ) }
			</HStack>
		</>
	);
};

export default FieldRating;

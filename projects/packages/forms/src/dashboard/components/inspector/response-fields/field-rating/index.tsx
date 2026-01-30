/**
 * External dependencies
 */
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	SVG,
	Path,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { RATING_ICONS } from '../../../../../blocks/field-rating/rating-icons.js';

type FieldRatingProps = {
	value?: string | null;
};

const FieldRating = ( { value }: FieldRatingProps ) => {
	const stringValue = value != null ? String( value ) : '';
	if ( stringValue.trim() === '' ) {
		return <>-</>;
	}
	const [ rateValue ] = stringValue.split( '/' );
	if ( ! rateValue || rateValue.trim() === '' ) {
		return <>-</>;
	}
	const iconSvg = (
		<SVG viewBox="0 0 24 24" aria-hidden="true">
			<Path
				d={ RATING_ICONS.stars }
				fill="#F0B849"
				stroke="#F0B849"
				strokeWidth="0"
				strokeLinejoin="round"
			/>
		</SVG>
	);
	return (
		<HStack spacing="1" alignment="topLeft">
			{ Array.from( { length: parseInt( rateValue ) }, ( _, index ) => (
				<div style={ { flex: '0 0 24px' } } key={ index }>
					{ iconSvg }
				</div>
			) ) }
		</HStack>
	);
};

export default FieldRating;

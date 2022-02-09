/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { useProduct } from '../../hooks/use-product';

export const AntiSpamIcon = () => (
	<svg width="14" height="19" viewBox="0 0 14 19" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M3.45474 18.2069L11.4547 0.706896L10.5453 0.291138L9.2837 3.05081C8.59914 2.69873 7.82278 2.49999 7 2.49999C5.93853 2.49999 4.95431 2.83076 4.1448 3.39485L2.18994 1.44L1.12928 2.50066L3.05556 4.42694C2.49044 5.15127 2.12047 6.0353 2.02469 6.99999H0V8.49999H2V9.99999H0V11.5H2.10002C2.35089 12.7359 3.0576 13.8062 4.03703 14.5279L2.54526 17.7911L3.45474 18.2069ZM4.68024 13.1209C3.95633 12.4796 3.5 11.5431 3.5 10.5V7.49999C3.5 5.567 5.067 3.99999 7 3.99999C7.60028 3.99999 8.16526 4.15111 8.65898 4.41738L4.68024 13.1209ZM10.3555 6.50155L11.1645 4.73191C11.6053 5.39383 11.8926 6.16683 11.9753 6.99999H14V8.49999H12V9.99999H14V11.5H11.9C11.4367 13.7822 9.41896 15.5 7 15.5C6.75078 15.5 6.50582 15.4818 6.26638 15.4466L6.92799 13.9993C6.95194 13.9998 6.97594 14 7 14C8.933 14 10.5 12.433 10.5 10.5V7.49999C10.5 7.15307 10.4495 6.81794 10.3555 6.50155Z"
			fill="#1E1E1E"
		/>
	</svg>
);

const AntiSpamCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'anti-spam' );
	const { name, description, slug } = detail;

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <AntiSpamIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ activate }
		/>
	);
};

AntiSpamCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AntiSpamCard;

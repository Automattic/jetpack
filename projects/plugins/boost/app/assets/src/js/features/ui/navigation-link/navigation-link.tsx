import { navigate } from '$lib/utils/navigate';
import React from 'react';

type NavigationLinkProps = {
	route: string;
};

/**
 * A component that renders a link that navigates to internal routes.
 * @param {{route: string}} props
 */
const NavigationLink: React.FC< NavigationLinkProps > = ( { route, ...props } ) => {
	const handleClick = event => {
		event.preventDefault();
		navigate( route );
	};

	return (
		// eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid
		<a href={ `#${ route }` } onClick={ handleClick } { ...props } />
	);
};

export default NavigationLink;

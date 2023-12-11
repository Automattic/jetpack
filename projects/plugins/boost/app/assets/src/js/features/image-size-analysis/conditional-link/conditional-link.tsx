import React, { ReactNode, MouseEventHandler } from 'react';
import { Link } from '$lib/utils/router'; // Adjust the import according to your project structure
import { recordBoostEvent } from '$lib/utils/analytics'; // Adjust the import according to your project structure

interface ConditionalLinkProps {
	isLink?: boolean;
	trackEvent?: string;
	trackEventProps?: string;
	children: ReactNode;
	[ x: string ]: unknown;
}

const ConditionalLink: React.FC< ConditionalLinkProps > = ( {
	isLink = true,
	trackEvent = '',
	trackEventProps = '',
	children,
	...rest
} ) => {
	const handleClick: MouseEventHandler< HTMLAnchorElement > = () => {
		if ( trackEvent !== '' ) {
			recordBoostEvent( trackEvent, { group: trackEventProps } );
		}
	};

	if ( isLink ) {
		return (
			// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
			<a onClick={ handleClick } { ...rest }>
				{ children }
			</a>
		);
	}
	return <>{ children }</>;
};

export default ConditionalLink;

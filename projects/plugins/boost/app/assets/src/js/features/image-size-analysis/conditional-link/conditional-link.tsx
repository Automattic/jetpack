import React, { ReactNode, MouseEventHandler } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
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

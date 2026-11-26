import { getRedirectUrl } from '@automattic/jetpack-components';
import ExternalLink from './external-link';
import type { ReactNode } from 'react';

/** Which support page a link opens. */
export type SupportTopic = 'safe-mode' | 'contact';

const REDIRECTS: Readonly< Record< SupportTopic, string > > = {
	'safe-mode': 'jetpack-support-safe-mode',
	contact: 'jetpack-contact-support',
};

/**
 * A link to a support page, in a new tab.
 *
 * @param {object}       props          - Component props.
 * @param {ReactNode}    props.children - The link text, filled in by `createInterpolateElement()`.
 * @param {SupportTopic} props.topic    - The page to open. Defaults to the Safe Mode support page.
 * @return {ReactNode} The link.
 */
export default function SupportLink( {
	children,
	topic = 'safe-mode',
}: {
	children?: ReactNode;
	topic?: SupportTopic;
} ): ReactNode {
	return <ExternalLink href={ getRedirectUrl( REDIRECTS[ topic ] ) }>{ children }</ExternalLink>;
}

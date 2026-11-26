import { Stack } from '@wordpress/ui';
import styles from '../styles.module.scss';
import SupportLink from '../support-link';
import { getContactText, getLaterText, getLearnMoreText, getOpenGuideText } from './copy';
import TextButton from './text-button';
import type { FlowState } from './steps';
import type { ReactNode } from 'react';

const FOOTER_LAYOUT = {
	direction: 'row',
	wrap: 'wrap',
	justify: 'space-between',
	align: 'baseline',
	gap: 'md',
	className: styles.divider,
} as const;

interface StepFooterProps {
	entry: FlowState[ 'entry' ];
	/** Offer the guide; a staging site's first view offers it in its note instead. */
	offerGuide: boolean;
	disabled: boolean;
	onOpenGuide: () => void;
	onLater: () => void;
}

/**
 * Below a question: the way into the guide, or out of it, and a link to support.
 *
 * @param {StepFooterProps} props - Component props.
 * @return {ReactNode} The footer.
 */
export default function StepFooter( {
	entry,
	offerGuide,
	disabled,
	onOpenGuide,
	onLater,
}: StepFooterProps ): ReactNode {
	if ( entry === 'guide' ) {
		return (
			<Stack { ...FOOTER_LAYOUT }>
				<span>{ getLaterText( <TextButton onClick={ onLater } disabled={ disabled } /> ) }</span>
				<SupportLink topic="contact">{ getContactText() }</SupportLink>
			</Stack>
		);
	}

	return (
		<Stack { ...FOOTER_LAYOUT }>
			{ offerGuide && (
				<span>
					{ getOpenGuideText( <TextButton onClick={ onOpenGuide } disabled={ disabled } /> ) }
				</span>
			) }
			<SupportLink>{ getLearnMoreText() }</SupportLink>
		</Stack>
	);
}

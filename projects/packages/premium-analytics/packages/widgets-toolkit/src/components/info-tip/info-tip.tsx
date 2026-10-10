/**
 * External dependencies
 */
import { Icon, Popover, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { info } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './info-tip.module.scss';
import type { ReactNode } from 'react';

export interface InfoTipProps {
	/** Names the trigger for assistive tech and titles the popover; it is not drawn. */
	label: string;
	/** Icon size: 20 beside a heading, 16 beside inline text. */
	size?: 16 | 20;
	/** Open on hover as well as on click. */
	openOnHover?: boolean;
	/** The explanation. */
	children: ReactNode;
}

/**
 * An info icon that opens a short explanation in a popover.
 *
 * Non-modal on purpose: `Popover.Root` with `modal` needs a `Popover.Close`
 * to cycle focus to, and a two-sentence tip has none.
 *
 * @param {InfoTipProps} props - The component props.
 * @return The info tip.
 */
export function InfoTip( { label, size = 20, openOnHover = false, children }: InfoTipProps ) {
	return (
		<Popover.Root>
			<Popover.Trigger
				openOnHover={ openOnHover }
				delay={ 200 }
				closeDelay={ 200 }
				aria-label={ label }
				className={ styles.trigger }
			>
				<Icon icon={ info } size={ size } />
			</Popover.Trigger>
			<Popover.Popup className={ styles.popup }>
				<Popover.Arrow />
				<VisuallyHidden render={ <Popover.Title /> }>{ label }</VisuallyHidden>
				<Popover.Description>{ children }</Popover.Description>
			</Popover.Popup>
		</Popover.Root>
	);
}

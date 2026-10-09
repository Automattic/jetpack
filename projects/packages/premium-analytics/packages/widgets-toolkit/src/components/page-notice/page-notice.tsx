/**
 * External dependencies
 */
import { Notice } from '@jetpack-premium-analytics/externals';
import { speak } from '@wordpress/a11y';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
import type { WidgetStateError } from '../widget-state';
import type { ReactElement } from 'react';

export interface PageNoticeProps extends Pick< WidgetStateError, 'description' | 'actions' > {
	/** `info` for a fact rather than a fault, such as a missing item; failures, access denied included, are an `error`. */
	intent?: 'error' | 'info';
	/** A way out of the page, such as back to its report; `render` is a childless router link, as its children would replace `label`. */
	link?: { label: string; render: ReactElement< Record< string, unknown > > };
}

/**
 * Stand in for a report's sections or a detail page's widgets when their data failed to load or does not exist.
 * Replace the sections rather than sit beside them: report tables pick their empty state from row count, not fetch status.
 *
 * @param {PageNoticeProps} props - The component props.
 * @return The page notice.
 */
export function PageNotice( { intent = 'error', description, actions, link }: PageNoticeProps ) {
	// The description alone: the notice's children would trail the action labels.
	useEffect( () => {
		if ( description ) {
			speak( description, intent === 'error' ? 'assertive' : 'polite' );
		}
	}, [ description, intent ] );

	return (
		<Notice.Root intent={ intent }>
			<Notice.Description>{ description }</Notice.Description>
			{ ( !! actions?.length || link ) && (
				<Notice.Actions>
					{ actions?.map( action => (
						<Notice.ActionButton key={ action.label } variant="outline" onClick={ action.onClick }>
							{ action.label }
						</Notice.ActionButton>
					) ) }
					{ link && <Notice.ActionLink render={ link.render }>{ link.label }</Notice.ActionLink> }
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}

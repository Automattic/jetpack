/**
 * External dependencies
 */
import { Notice } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import type { DescribedError } from '../../helpers/describe-error';
import type { ReactElement } from 'react';

export interface DetailPageNoticeProps extends Pick<
	DescribedError,
	'intent' | 'description' | 'actions'
> {
	/** A way out of the page, such as back to its report; `render` takes the router link. */
	link?: { label: string; render: ReactElement };
}

/**
 * Stand in for a detail page's widgets when the page's subject failed to load or does not exist.
 *
 * @param {DetailPageNoticeProps} props - The component props.
 * @return The detail page notice.
 */
export function DetailPageNotice( { intent, description, actions, link }: DetailPageNoticeProps ) {
	return (
		// The default announcement (children) would trail the action labels.
		<Notice.Root intent={ intent } spokenMessage={ description }>
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

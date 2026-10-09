/**
 * External dependencies
 */
import { Button, EmptyState, Icon, LinkButton } from '@jetpack-premium-analytics/externals';
import { search } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './chart-empty-state.module.scss';

export type EmptyStateAction =
	{ label: string; href: string; target?: '_blank' } | { label: string; onClick: () => void };

export type ChartEmptyStateProps = {
	/**
	 * Defaults to the `search` magnifier when omitted; pass `null` to render no icon.
	 */
	icon?: React.ComponentProps< typeof Icon >[ 'icon' ] | null;

	/**
	 * @default "We couldn’t find results for this time period."
	 */
	text?: string;
	/** One action under the description. */
	action?: EmptyStateAction;
};

/**
 * The empty state chart wrappers render when their data has nothing to show.
 */
export function ChartEmptyState( {
	icon = search,
	text = __( 'We couldn’t find results for this time period.', 'jetpack-premium-analytics-pkg' ),
	action,
}: ChartEmptyStateProps ) {
	return (
		<EmptyState.Root className={ styles.container }>
			{ /* 40px matches the error state's glyph so adjacent widgets showing
			     different states keep the same vertical rhythm. */ }
			{ icon && <Icon size={ 40 } className={ styles.icon } icon={ icon } /> }
			<EmptyState.Description>{ text }</EmptyState.Description>
			{ action && (
				<EmptyState.Actions>
					{ 'href' in action ? (
						<LinkButton variant="outline" href={ action.href } target={ action.target }>
							{ action.label }
						</LinkButton>
					) : (
						<Button type="button" variant="outline" onClick={ action.onClick }>
							{ action.label }
						</Button>
					) }
				</EmptyState.Actions>
			) }
		</EmptyState.Root>
	);
}

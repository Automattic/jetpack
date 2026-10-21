/**
 * External dependencies
 */
import { Button, EmptyState, Icon, ButtonLink } from '@jetpack-premium-analytics/externals';
import { search } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './chart-empty-state.module.scss';

export type EmptyStateAction =
	| { label: string; href: string; openInNewTab?: boolean; onClick?: never }
	| { label: string; onClick: () => void };

export type ChartEmptyStateProps = {
	/**
	 * Defaults to the `search` magnifier when omitted.
	 */
	icon?: React.ComponentProps< typeof Icon >[ 'icon' ];

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
		<div className={ styles.root }>
			<EmptyState.Root className={ styles.container }>
				<EmptyState.Visual className={ styles.icon }>
					<Icon size={ 40 } icon={ icon } />
				</EmptyState.Visual>
				<EmptyState.Description>{ text }</EmptyState.Description>
				{ action && (
					<EmptyState.Actions>
						{ 'href' in action ? (
							<ButtonLink
								variant="outline"
								size="compact"
								href={ action.href }
								openInNewTab={ action.openInNewTab }
							>
								{ action.label }
							</ButtonLink>
						) : (
							<Button variant="outline" size="compact" onClick={ action.onClick }>
								{ action.label }
							</Button>
						) }
					</EmptyState.Actions>
				) }
			</EmptyState.Root>
		</div>
	);
}

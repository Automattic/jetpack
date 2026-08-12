/**
 * External dependencies
 */
import { Link, Stack } from '@jetpack-premium-analytics/externals';
import { DrilldownLeafCell, safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { Field } from '@jetpack-premium-analytics/externals';

/**
 * A flattened referrer group, source, or domain shown in the records table.
 */
export type ReferrerRecord = {
	id: string;
	parentId?: string;
	parentLabel?: string;
	label: string;
	views: number;
	previousValue?: number;
	link?: string;
	icon?: string;
	hasChildren?: boolean;
};

/**
 * Fixed-size favicon slot for a referrer row.
 *
 * Rendered for every row, with or without a usable favicon: Stats leaves
 * `icon` empty for many referrers, and the remote favicons it does return can
 * 404. Reserving the slot keeps sibling labels on one indent instead of
 * shifting them by the icon's width as each image resolves.
 *
 * @param props      - The component props.
 * @param props.icon - The row's favicon URL, when it has one.
 * @return The favicon slot.
 */
function ReferrerFavicon( { icon }: { icon?: string } ) {
	// Remember which URL failed rather than a boolean, so a row that later
	// renders a different favicon tries that one instead of staying blank.
	const [ failedIcon, setFailedIcon ] = useState< string | undefined >( undefined );
	const showIcon = !! icon && failedIcon !== icon;
	const handleError = useCallback( () => setFailedIcon( icon ), [ icon ] );

	return (
		<span className={ styles.faviconSlot }>
			{ showIcon && (
				// The intrinsic size must come from the attributes, not just the
				// stylesheet: without them the image has no height until it loads,
				// which moves the slot's baseline and nudges the whole row. Keep
				// them in step with `--wpds-dimension-size-2xs` in the stylesheet.
				<img
					src={ icon }
					onError={ handleError }
					alt=""
					width={ 16 }
					height={ 16 }
					className={ styles.favicon }
				/>
			) }
		</span>
	);
}

/**
 * DataViews field config for the Referrers records table.
 *
 * @return The field config.
 */
export function getReferrerFields(): Field< ReferrerRecord >[] {
	return [
		{
			id: 'referrer',
			label: __( 'Referrer', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				const safeUrl = safeHttpUrl( item.link );
				const label = (
					<Stack render={ <span /> } direction="row" gap="sm" align="center">
						<ReferrerFavicon icon={ item.icon } />
						<span>{ item.label }</span>
					</Stack>
				);

				// Group/source rows keep DataViews' title treatment and never link
				// away; only leaf referrers use the drilldown leaf treatment.
				if ( item.hasChildren ) {
					return label;
				}

				return (
					<DrilldownLeafCell groupLabel={ item.parentLabel }>
						{ safeUrl ? (
							<Link href={ safeUrl } openInNewTab rel="noopener noreferrer">
								{ label }{ ' ' }
							</Link>
						) : (
							label
						) }
					</DrilldownLeafCell>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ item.previousValue }
					dataFormat={ {
						type: 'number',
						options: { decimals: 0, useMultipliers: false },
					} }
					fontSize="md"
				/>
			),
		},
	];
}

/**
 * Free-tier replica of the DataViews toolbar.
 *
 * On the free tier we replace `<DataViews>`'s default UI with a custom
 * children tree (see ActivityLog/index.tsx). The default UI's left
 * cluster (search + filters) and right cluster (cog + header slot) is
 * mirrored here as visually-disabled lookalikes wrapped in upgrade
 * tooltips, so the page surface still reads as a real DataViews table
 * even though the affordances themselves only unlock on a Backup plan.
 *
 * The cog is the one functional control — it falls through to the real
 * `DataViews.ViewConfig` and stays gated to the locked `perPage` via
 * the `config.perPageSizes` we pass into `<DataViews>`.
 */
import { Button, SearchControl, Tooltip } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __, _x } from '@wordpress/i18n';
import { funnel } from '@wordpress/icons';

const NOOP = () => undefined;

/**
 * Render the disabled toolbar shown above the locked Activity Log table.
 *
 * @return The toolbar element.
 */
export function FreeTierToolbar() {
	const upgradeTooltip = __( 'Upgrade your plan to use this feature.', 'jetpack-activity-log' );
	const searchLabel = __( 'Search', 'jetpack-activity-log' );

	return (
		<div className="dataviews__view-actions jp-activity-log__free-toolbar">
			<div className="dataviews__search jp-activity-log__free-toolbar-primary">
				<Tooltip text={ upgradeTooltip } placement="top">
					{ /*
					 * SearchControl swallows pointer events on its inner
					 * input when `disabled`, so wrap it to give Tooltip a
					 * stable hover target across the whole control.
					 */ }
					<div className="jp-activity-log__free-toolbar-search">
						<SearchControl
							className="dataviews-search"
							value=""
							onChange={ NOOP }
							label={ searchLabel }
							placeholder={ searchLabel }
							size="compact"
							disabled
						/>
					</div>
				</Tooltip>
				<Tooltip text={ upgradeTooltip } placement="top">
					<Button
						size="compact"
						icon={ funnel }
						disabled
						accessibleWhenDisabled
						label={ _x( 'Filter', 'verb', 'jetpack-activity-log' ) }
						className="dataviews-filters__visibility-toggle"
					/>
				</Tooltip>
			</div>
			<div className="jp-activity-log__free-toolbar-actions">
				<DataViews.ViewConfig />
			</div>
		</div>
	);
}

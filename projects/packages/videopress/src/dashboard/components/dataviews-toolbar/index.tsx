import { Button } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { blockTable, category } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import './style.scss';
import type { SupportedLayouts, View } from '@wordpress/dataviews';
import type { ReactElement } from 'react';

type LayoutType = View[ 'type' ];

// Layouts the toggle can show; any other set falls back to DataViews' own menu.
const LAYOUT_OPTIONS: Partial< Record< LayoutType, { label: string; icon: ReactElement } > > = {
	grid: { label: __( 'Grid', 'jetpack-videopress-pkg' ), icon: category },
	table: { label: __( 'Table', 'jetpack-videopress-pkg' ), icon: blockTable },
};

/**
 * Switch a view to another layout the way DataViews' own switcher does: drop
 * the current layout's options and apply the target layout's defaults.
 *
 * @param view           - The current view.
 * @param type           - The layout to switch to.
 * @param defaultLayouts - The defaults for each supported layout.
 * @return The view in the new layout, or the same view when it is already in it.
 */
export function switchLayout( view: View, type: LayoutType, defaultLayouts: SupportedLayouts ) {
	if ( view.type === type ) {
		return view;
	}
	const viewWithoutLayout = { ...view };
	if ( 'layout' in viewWithoutLayout ) {
		delete viewWithoutLayout.layout;
	}
	// `true` enables a layout with no settings of its own.
	const defaults = defaultLayouts[ type as keyof SupportedLayouts ];
	return {
		...viewWithoutLayout,
		type,
		...( typeof defaults === 'object' ? defaults : {} ),
	} as View;
}

type LayoutToggleProps = {
	view: View;
	onChangeView: ( view: View ) => void;
	defaultLayouts: SupportedLayouts;
};

/**
 * With exactly two layouts, a pair of buttons that switches in one click, in
 * place of DataViews' menu. Otherwise, DataViews' own switcher.
 *
 * @param props                - Component props.
 * @param props.view           - The current view.
 * @param props.onChangeView   - Called with the view in the chosen layout.
 * @param props.defaultLayouts - The defaults for each supported layout.
 * @return The layout control.
 */
export function LayoutToggle( { view, onChangeView, defaultLayouts }: LayoutToggleProps ) {
	const layouts = ( Object.keys( defaultLayouts ) as LayoutType[] ).flatMap( type =>
		LAYOUT_OPTIONS[ type ] ? [ { type, ...LAYOUT_OPTIONS[ type ] } ] : []
	);
	if ( layouts.length !== 2 || layouts.length !== Object.keys( defaultLayouts ).length ) {
		return <DataViews.LayoutSwitcher />;
	}
	return (
		<div
			className="vp-dataviews-toolbar__layout-toggle"
			role="group"
			aria-label={ __( 'Layout', 'jetpack-videopress-pkg' ) }
		>
			{ layouts.map( ( { type, label, icon } ) => (
				<Button
					key={ type }
					size="compact"
					icon={ icon }
					label={ label }
					isPressed={ view.type === type }
					onClick={ () => {
						if ( view.type !== type ) {
							onChangeView( switchLayout( view, type, defaultLayouts ) );
						}
					} }
				/>
			) ) }
		</div>
	);
}

type DataViewsContentProps = LayoutToggleProps & {
	searchLabel?: string;
};

/**
 * DataViews' default UI with the layout menu replaced by `LayoutToggle`.
 * Render it as the children of `DataViews`.
 *
 * @param props                - Component props.
 * @param props.view           - The current view.
 * @param props.onChangeView   - Called with the view in the chosen layout.
 * @param props.defaultLayouts - The defaults for each supported layout.
 * @param props.searchLabel    - Label for the search field.
 * @return The DataViews UI.
 */
export default function DataViewsContent( {
	view,
	onChangeView,
	defaultLayouts,
	searchLabel,
}: DataViewsContentProps ) {
	return (
		<>
			<Stack
				direction="row"
				align="top"
				justify="space-between"
				className="dataviews__view-actions"
				gap="xs"
			>
				<Stack direction="row" justify="start" gap="sm" className="dataviews__search">
					<DataViews.Search label={ searchLabel } />
					<DataViews.FiltersToggle />
				</Stack>
				<Stack direction="row" gap="xs" style={ { flexShrink: 0 } }>
					<LayoutToggle
						view={ view }
						onChangeView={ onChangeView }
						defaultLayouts={ defaultLayouts }
					/>
					<DataViews.ViewConfig />
				</Stack>
			</Stack>
			<DataViews.FiltersToggled className="dataviews-filters__container" />
			<DataViews.Layout />
			<DataViews.Footer />
		</>
	);
}

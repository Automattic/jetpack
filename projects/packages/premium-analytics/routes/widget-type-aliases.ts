/**
 * External dependencies
 */
import type { WidgetIcon, WidgetType } from '@wordpress/widget-primitives';

/**
 * A page-local alias of a registered widget type. The widget host titles a card
 * by its widget *type*, so a fixed composition that renders one type several
 * times, or under a design title the registry does not carry, reuses the base
 * type's render module under an alias name instead. Aliases exist only in the
 * page's own `widgetTypes`: with no widget gallery on a fixed composition, they
 * can never be picked elsewhere.
 *
 * Titles and help are lazy getters so translations resolve after the i18n
 * locale data has loaded; icons are static module refs.
 */
export type WidgetTypeAlias = {
	baseType: `jpa/${ string }`;
	variants: ReadonlyArray< {
		name: `jpa/${ string }`;
		getTitle: () => string;
		getHelp?: () => NonNullable< WidgetType[ 'help' ] >;
		icon?: WidgetIcon;
	} >;
};

/**
 * Append the aliases whose base type has resolved. Returns the input array
 * untouched when nothing resolves, so memoized consumers keep their identity.
 *
 * @param widgetTypes - The resolved registry.
 * @param aliases     - The page's aliases.
 * @return The registry plus the page's aliases.
 */
export function withWidgetTypeAliases(
	widgetTypes: WidgetType[],
	aliases: ReadonlyArray< WidgetTypeAlias >
): WidgetType[] {
	const resolved = aliases.flatMap( ( { baseType, variants } ) => {
		const base = widgetTypes.find( widgetType => widgetType.name === baseType );

		return base
			? variants.map( variant => ( {
					...base,
					name: variant.name,
					title: variant.getTitle(),
					...( variant.getHelp ? { help: variant.getHelp() } : {} ),
					...( variant.icon ? { icon: variant.icon } : {} ),
			  } ) )
			: [];
	} );

	return resolved.length ? [ ...widgetTypes, ...resolved ] : widgetTypes;
}

/**
 * The registry names a layout needs resolved: each alias mapped back to the
 * base type it renders with, deduplicated.
 *
 * @param typeNames - The widget type names a layout renders.
 * @param aliases   - The page's aliases.
 * @return The base type names.
 */
export function toWidgetTypeBaseNames(
	typeNames: readonly string[],
	aliases: ReadonlyArray< WidgetTypeAlias >
): string[] {
	const baseByAlias = new Map< string, string >(
		aliases.flatMap( ( { baseType, variants } ) =>
			variants.map( variant => [ variant.name, baseType ] as const )
		)
	);

	return [ ...new Set( typeNames.map( name => baseByAlias.get( name ) ?? name ) ) ];
}

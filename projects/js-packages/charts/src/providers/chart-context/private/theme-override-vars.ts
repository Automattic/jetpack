import type { ChartTheme } from '../../../types';

/** How many series-palette slots the catalog emits. `theme.colors` entries past this are ignored. */
export const SERIES_SLOT_COUNT = 5;

/**
 * The catalog role holding one series-palette slot.
 *
 * @param slot - The one-based slot number.
 * @return The role name.
 */
export const seriesRole = ( slot: number ): string => `--a8c-charts-color-series-${ slot }`;

// The consumer theme fields that correspond to an emitted catalog role, and the role each one overrides. Each role must be read by exactly the elements its field controlled before the role existed: `svgLabelSmall.fill` maps to the narrow `--a8c-charts-color-label-axis` rather than `--a8c-charts-color-label`, because the broad role is also read by legend labels, heatmap cell values, funnel labels and the line-chart tooltip, which that field never moved.
//
// `theme.colors` is the one field mapped by position rather than by name: entry N publishes slot N+1, which is what makes it sugar over the five slots rather than a second palette with its own precedence.
const ROLE_FOR_FIELD: Array< [ string, ( theme: Partial< ChartTheme > ) => string | undefined ] > =
	[
		[ '--a8c-charts-color-background', theme => theme.backgroundColor ],
		[ '--a8c-charts-color-grid', theme => theme.gridStyles?.stroke ],
		[ '--a8c-charts-color-axis', theme => theme.xAxisLineStyles?.stroke ],
		[ '--a8c-charts-color-tick', theme => theme.xTickLineStyles?.stroke ],
		[ '--a8c-charts-color-label-axis', theme => theme.svgLabelSmall?.fill ],
		...Array.from(
			{ length: SERIES_SLOT_COUNT },
			( _, index ): [ string, ( theme: Partial< ChartTheme > ) => string | undefined ] => [
				seriesRole( index + 1 ),
				theme => theme.colors?.[ index ],
			]
		),
	];

let warnedAboutExtraColors = false;

/**
 * Warns once when a consumer passes more colours than there are slots to publish them into.
 *
 * @param count - How many entries `theme.colors` holds.
 */
function warnOnceAboutExtraColors( count: number ): void {
	if ( warnedAboutExtraColors || process.env.NODE_ENV === 'production' ) {
		return;
	}

	warnedAboutExtraColors = true;
	// eslint-disable-next-line no-console
	console.warn(
		`[Charts] theme.colors holds ${ count } colours and the palette has ${ SERIES_SLOT_COUNT } slots, so entries past the ${ SERIES_SLOT_COUNT }th are ignored. ` +
			'Set a per-series colour with `options.stroke` instead.'
	);
}

/**
 * The variable a `theme` prop override is published as, one layer outside the role itself.
 *
 * `chart-scope.scss` declares each of these roles as `var(<role>-theme, <catalog default>)`, so an override that is invalid at computed-value time — a fallback-less `var()` naming a token the host never set — only invalidates this variable, and the role still resolves its mapped `--wpds-*` token. Published as the role directly, such a value took the role and every bare `var(<role>)` read site down with it.
 *
 * @param role - The catalog role being overridden.
 * @return The custom property carrying the consumer's value.
 */
export const themeLayerVar = ( role: string ): string => `${ role }-theme`;

/** Every role whose catalog entry must read a theme layer. `src/styles/test/chart-scope.test.ts` checks the stylesheet against this. */
export const THEME_LAYERED_ROLES: readonly string[] = ROLE_FOR_FIELD.map( ( [ role ] ) => role );

/**
 * Whether a value reads the role it is being published for, which would make the catalog entry depend on itself.
 *
 * The dependency runs `<role>: var(<role>-theme, …)`, so a value naming `<role>` closes a cycle through the catalog entry. CSS marks every custom property in a cycle invalid at computed-value time — the role's own fallback is *not* used, so the token resolves to nothing and every chart loses that colour. Verified in Chrome: `--role-theme: var(--role, blue); --role: var(--role-theme, green)` leaves `--role` empty, not `green`.
 *
 * Three things this has to get right, none of which a plain substring test gets:
 *
 * `var()` permits whitespace after the opening paren, so testing for `var(<role>` misses `var( --a8c-charts-color-grid, … )`.
 *
 * Several roles are prefixes of others (`--a8c-charts-color-label` of `--a8c-charts-color-label-secondary`), and every role is a prefix of its own theme layer. A prefix match would read a legitimate cross-role pointer as a self-reference and silently drop the override, so the role must be followed by something that cannot continue an identifier — `-` included. A value naming `<role>-theme` is therefore not treated as a self-reference: that cycle is confined to the theme layer, which leaves the role free to fall back to the catalog default.
 *
 * `resolveCssVariable` also accepts a bare custom-property name with no `var()` wrapper (`--a8c-charts-color-grid`), so that is legal `theme` input too. It forms no cycle — custom properties accept arbitrary token streams — so it survives as a literal string and drops silently at the use site instead of falling back to the catalog default.
 *
 * @param value - The consumer's value for the field.
 * @param role  - The catalog role this value would override.
 * @return True when the value reads `role`, so it must not be published.
 */
const readsOwnRole = ( value: string, role: string ): boolean =>
	value.trim() === role ||
	new RegExp( `var\\(\\s*${ role.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }(?![\\w-])` ).test(
		value
	);

export type ThemeOverrides = {
	/** The custom properties to write on the provider wrapper. */
	vars: Record< string, string >;
	/** Every mapped role the consumer set a value for, whether or not it was published. */
	roles: readonly string[];
};

/**
 * Maps a sparse consumer theme onto the theme-layer variables its overridden catalog roles read, so CSS-painted and JS-resolved colours read one source.
 *
 * A value that reads the role it would override is left unpublished — that is the default theme's own pointer surviving `mergeThemes`, and publishing it would invalidate the role. The role is still reported in `roles`: `withCatalogPointers` restores its theme field to the catalog pointer either way, so CSS and visx agree on the catalog default rather than visx painting a literal CSS never sees.
 *
 * `theme.colors` publishes through the same mechanism, one slot per entry, so a CSS declaration of `--a8c-charts-color-series-N` still beats it and a short array leaves the later slots unset rather than blank.
 *
 * @param theme - The consumer's `theme` prop, before merging with the default theme.
 * @return The wrapper's custom properties, and the roles the consumer overrode.
 */
export const themeOverrideVars = ( theme?: Partial< ChartTheme > ): ThemeOverrides => {
	if ( ! theme ) {
		return { vars: {}, roles: [] };
	}

	if ( Array.isArray( theme.colors ) && theme.colors.length > SERIES_SLOT_COUNT ) {
		warnOnceAboutExtraColors( theme.colors.length );
	}

	const vars: Record< string, string > = {};
	const roles: string[] = [];

	for ( const [ role, read ] of ROLE_FOR_FIELD ) {
		const value = read( theme );

		if ( typeof value !== 'string' || value === '' ) {
			continue;
		}

		roles.push( role );

		if ( ! readsOwnRole( value, role ) ) {
			vars[ themeLayerVar( role ) ] = value;
		}
	}

	return { vars, roles };
};

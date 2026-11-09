import { addFilter } from '@wordpress/hooks';

const FOOTER_STRINGS: Record< string, string > = {
	'%s item': '%s subscriber',
	'%s items': '%s subscribers',
	'%1$s of %2$s item': '%1$s of %2$s subscriber',
	'%1$s of %2$s items': '%1$s of %2$s subscribers',
	'%s item selected': '%s subscriber selected',
	'%s items selected': '%s subscribers selected',
};

const FILTER_NAMESPACE = 'jetpack-newsletter/dataviews-footer';

let installed = false;

/**
 * Override DataViews' default-domain "Item(s)" footer strings with
 * "subscriber(s)" via the WP i18n filter hook. Idempotent — safe to call from
 * any module-level entry point.
 */
export function installDataViewsFooterI18n(): void {
	if ( installed ) {
		return;
	}
	installed = true;

	addFilter(
		'i18n.gettext_default',
		FILTER_NAMESPACE,
		( translation: string, text: string ) => FOOTER_STRINGS[ text ] ?? translation
	);

	addFilter(
		'i18n.ngettext_default',
		FILTER_NAMESPACE,
		( translation: string, single: string, plural: string, count: number ) => {
			const key = count === 1 ? single : plural;
			return FOOTER_STRINGS[ key ] ?? translation;
		}
	);
}

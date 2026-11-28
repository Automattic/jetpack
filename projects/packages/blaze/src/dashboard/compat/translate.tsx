/**
 * Calypso-style `translate()` for the remote DSP widget's `translateFn`; msgids are registered verbatim in `lib/promote-post/string.ts`.
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, _nx, _x, sprintf } from '@wordpress/i18n';
import type { ReactElement, ReactNode } from 'react';

const DOMAIN = 'jetpack-blaze';

type Options = {
	args?: unknown[] | Record< string, unknown > | string | number;
	components?: Record< string, ReactElement >;
	context?: string;
	count?: number;
	comment?: string;
	textOnly?: boolean;
};

/**
 * Translate a Calypso-format string, interpolating `%(name)s` args and `{{tag}}` components.
 *
 * @param single          - Singular msgid.
 * @param pluralOrOptions - Plural msgid, or options.
 * @param maybeOptions    - Options when a plural is given.
 * @return Translated string or element.
 */
export function translate(
	single: string,
	pluralOrOptions?: string | Options,
	maybeOptions?: Options
): ReactNode {
	const plural = typeof pluralOrOptions === 'string' ? pluralOrOptions : undefined;
	const options = ( typeof pluralOrOptions === 'object' ? pluralOrOptions : maybeOptions ) || {};
	const { context, count = 1, args, components } = options;

	/* eslint-disable @wordpress/i18n-no-variables, @wordpress/i18n-text-domain -- Dynamic lookup of msgids registered in string.ts. */
	let text: string;
	if ( plural !== undefined ) {
		text = context
			? _nx( single, plural, count, context, DOMAIN )
			: _n( single, plural, count, DOMAIN );
	} else {
		text = context ? _x( single, context, DOMAIN ) : __( single, DOMAIN );
	}
	/* eslint-enable @wordpress/i18n-no-variables, @wordpress/i18n-text-domain */

	if ( args !== undefined ) {
		const format = sprintf as ( f: string, ...values: unknown[] ) => string;
		text = Array.isArray( args ) ? format( text, ...args ) : format( text, args );
	}

	if ( ! components ) {
		return text;
	}

	const markup = text
		.replace( /\{\{(\w+)\s*\/\}\}/g, '<$1 />' )
		.replace( /\{\{\/(\w+)\}\}/g, '</$1>' )
		.replace( /\{\{(\w+)\}\}/g, '<$1>' );
	try {
		return createInterpolateElement( markup, components );
	} catch {
		return text;
	}
}

export const useTranslate = () => translate;

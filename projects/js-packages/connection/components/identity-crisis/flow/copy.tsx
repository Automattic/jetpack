import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import type { OptionId, StepId } from './steps';
import type { ReactNode } from 'react';

// Store and Jetpack variants use `_x()`, so minification can't merge them with the `__()` variant into one call.

/** What the flow's text depends on. */
export interface CopyContext {
	isStore: boolean;
	hasJetpackPlugin: boolean;
	/** This site's address, formatted for display. */
	x: string;
	/** The address WordPress.com has on record, formatted for display. */
	z: string;
}

export interface OptionCopy {
	label: ReactNode;
	/** Always shown. */
	hint: ReactNode;
	/** The consequence, shown once the option is selected. */
	more?: ReactNode;
	button: string;
	/** The button while its action runs; options that only move on have none. */
	busy?: string;
}

/**
 * Fills `<x />` and `<z />` with the addresses as elements, so nothing in an address is parsed as a tag.
 *
 * @param text - The translated text.
 * @param c    - The copy context.
 * @return The text with the addresses in bold.
 */
function fill( text: string, c: CopyContext ): ReactNode {
	return createInterpolateElement( text, {
		x: <strong>{ c.x }</strong>,
		z: <strong>{ c.z }</strong>,
	} );
}

/**
 * The question a step asks.
 *
 * @param step - The step.
 * @param c    - The copy context.
 * @return The question.
 */
export function getStepTitle( step: StepId, c: CopyContext ): ReactNode {
	switch ( step ) {
		case 'main':
			/* translators: <z />: the address WordPress.com has on record, e.g. example.com. */
			return fill( __( 'What is <z />?', 'jetpack-connection-js' ), c );
		case 'copy':
			return __( 'What should happen to this copy?', 'jetpack-connection-js' );
		case 'replaced':
			return fill(
				/* translators: <x />: this site's address. <z />: the address WordPress.com has on record. */
				__( 'Was <x /> recently replaced with content from <z />?', 'jetpack-connection-js' ),
				c
			);
		default: {
			const unhandled: never = step;
			return unhandled;
		}
	}
}

/**
 * An answer's label, hint, consequence and button.
 *
 * @param id - The answer.
 * @param c  - The copy context.
 * @return The copy.
 */
export function getOptionCopy( id: OptionId, c: CopyContext ): OptionCopy {
	const updateAddress = {
		button: __( 'Update address', 'jetpack-connection-js' ),
		busy: __( 'Updating…', 'jetpack-connection-js' ),
	};
	const stayInSafeMode = {
		button: __( 'Stay in Safe Mode', 'jetpack-connection-js' ),
		busy: __( 'Saving…', 'jetpack-connection-js' ),
	};
	const connectSeparately = {
		button: __( 'Connect separately', 'jetpack-connection-js' ),
		busy: __( 'Connecting…', 'jetpack-connection-js' ),
	};
	const next = { button: __( 'Next', 'jetpack-connection-js' ) };

	switch ( id ) {
		case 'old':
			return {
				label: c.isStore
					? _x( 'This store’s old address', 'WooCommerce store', 'jetpack-connection-js' )
					: __( 'This site’s old address', 'jetpack-connection-js' ),
				hint: fill(
					c.isStore
						? /* translators: <x />: this store's address. */
							_x(
								'The store moved from there to <x />. Nothing was at <x /> before.',
								'WooCommerce store',
								'jetpack-connection-js'
							)
						: /* translators: <x />: this site's address. */
							__(
								'The site moved from there to <x />. Nothing was at <x /> before.',
								'jetpack-connection-js'
							),
					c
				),
				more: fill(
					/* translators: <z />: the address WordPress.com has on record. */
					__(
						'This updates the address WordPress.com has on file. Your connection, history, and data stay the same. If <z /> is still running, it will stop syncing and ask this same question.',
						'jetpack-connection-js'
					),
					c
				),
				...updateAddress,
			};
		case 'original':
			return {
				label: c.isStore
					? _x( 'The original store', 'WooCommerce store', 'jetpack-connection-js' )
					: __( 'The original site', 'jetpack-connection-js' ),
				hint: fill(
					c.isStore
						? /* translators: <x />: this store's address. */
							_x(
								'This one, <x />, is a copy of it, for example a staging or test store.',
								'WooCommerce store',
								'jetpack-connection-js'
							)
						: /* translators: <x />: this site's address. */
							__(
								'This one, <x />, is a copy of it, for example a staging or test site.',
								'jetpack-connection-js'
							),
					c
				),
				more: fill(
					/* translators: <z />: the address WordPress.com has on record. */
					__(
						'<z /> keeps its connection, history, and data. Next, you choose what this copy should do.',
						'jetpack-connection-js'
					),
					c
				),
				...next,
			};
		case 'copyof':
			return {
				label: c.isStore
					? _x( 'A copy of this store', 'WooCommerce store', 'jetpack-connection-js' )
					: __( 'A copy of this site', 'jetpack-connection-js' ),
				hint: fill(
					c.isStore
						? /* translators: <x />: this store's address. */
							_x(
								'It was made from this one, <x />, for example as its staging store.',
								'WooCommerce store',
								'jetpack-connection-js'
							)
						: /* translators: <x />: this site's address. */
							__(
								'It was made from this one, <x />, for example as its staging site.',
								'jetpack-connection-js'
							),
					c
				),
				more: __( 'Next, one more question to find the right fix.', 'jetpack-connection-js' ),
				...next,
			};
		case 'safe':
			return {
				label: __( 'Keep it in Safe Mode', 'jetpack-connection-js' ),
				hint: fill(
					c.isStore
						? /* translators: <z />: the address WordPress.com has on record. */
							_x(
								'Best for a short-lived test store, or a copy that will be pushed back to <z /> after testing. Payments will not be interrupted.',
								'WooCommerce store',
								'jetpack-connection-js'
							)
						: /* translators: <z />: the address WordPress.com has on record. */
							__(
								'Best for a short-lived test site, or a copy that will be pushed back to <z /> after testing.',
								'jetpack-connection-js'
							),
					c
				),
				more: fill(
					c.hasJetpackPlugin
						? /* translators: <z />: the address WordPress.com has on record. */
							_x(
								'Some Jetpack features stay off here, including security features such as SSO, the firewall and the site monitor. <z /> is unaffected.',
								'Jetpack plugin connected',
								'jetpack-connection-js'
							)
						: /* translators: <z />: the address WordPress.com has on record. */
							__(
								'Features that sync with WordPress.com stay paused here. <z /> is unaffected.',
								'jetpack-connection-js'
							),
					c
				),
				...stayInSafeMode,
			};
		case 'fresh':
			return {
				label: __( 'Give it its own connection', 'jetpack-connection-js' ),
				hint: c.isStore
					? _x(
							'Best for a development store you will keep working on, or a copy that needs every feature.',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __(
							'Best for a development site you will keep working on, or a copy that needs every feature.',
							'jetpack-connection-js'
						),
				more: fill(
					/* translators: <z />: the address WordPress.com has on record. */
					__(
						'This restores its previous connection if it had one, or starts fresh. <z /> is unaffected. If this copy is later pushed over <z />, the connection on <z /> has to be restored. You will sign in to WordPress.com to finish.',
						'jetpack-connection-js'
					),
					c
				),
				...connectSeparately,
			};
		case 'yes':
			return {
				label: __( 'Yes', 'jetpack-connection-js' ),
				hint: fill(
					/* translators: <z />: the address WordPress.com has on record. */
					__(
						'For example, staging was pushed live, or a backup of <z /> was restored here.',
						'jetpack-connection-js'
					),
					c
				),
				more: fill(
					/* translators: <x />: this site's address. <z />: the address WordPress.com has on record. */
					__(
						'This gives <x /> its own connection again, restoring its previous one if it had it. <z /> is unaffected. You will sign in to WordPress.com to finish.',
						'jetpack-connection-js'
					),
					c
				),
				...connectSeparately,
			};
		case 'no':
			return {
				label: __( 'No', 'jetpack-connection-js' ),
				hint: fill(
					c.isStore
						? /* translators: <z />: the address WordPress.com has on record. */
							_x(
								'Nothing was copied here. <z /> was made from this store.',
								'WooCommerce store',
								'jetpack-connection-js'
							)
						: /* translators: <z />: the address WordPress.com has on record. */
							__(
								'Nothing was copied here. <z /> was made from this site.',
								'jetpack-connection-js'
							),
					c
				),
				more: fill(
					/* translators: <x />: this site's address. <z />: the address WordPress.com has on record. */
					__(
						'This updates the address WordPress.com has on file back to <x />. <z /> stops syncing and asks its administrator this same question. Choose “Keep it in Safe Mode” there to keep it as a copy.',
						'jetpack-connection-js'
					),
					c
				),
				...updateAddress,
			};
		case 'unsure':
			return {
				label: __( 'I’m not sure', 'jetpack-connection-js' ),
				hint: c.isStore
					? _x(
							'Stay in Safe Mode while you find out. Nothing changes until you decide. Payments will not be interrupted.',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __(
							'Stay in Safe Mode while you find out. Nothing changes until you decide.',
							'jetpack-connection-js'
						),
				...stayInSafeMode,
			};
		default: {
			const unhandled: never = id;
			return unhandled;
		}
	}
}

/**
 * What Safe Mode pauses, on the first view.
 *
 * @param c - The copy context.
 * @return The text.
 */
export function getPausedText( c: CopyContext ): string {
	if ( c.hasJetpackPlugin ) {
		return c.isStore
			? _x(
					'Features that sync with WordPress.com — like Stats and Backups — are paused in Safe Mode until you resolve this. Payments will not be interrupted.',
					'WooCommerce store',
					'jetpack-connection-js'
				)
			: __(
					'Features that sync with WordPress.com — like Stats and Backups — are paused in Safe Mode until you resolve this.',
					'jetpack-connection-js'
				);
	}
	return c.isStore
		? _x(
				'Features that sync with WordPress.com are paused in Safe Mode until you resolve this. Payments will not be interrupted.',
				'WooCommerce store',
				'jetpack-connection-js'
			)
		: __(
				'Features that sync with WordPress.com are paused in Safe Mode until you resolve this.',
				'jetpack-connection-js'
			);
}

/**
 * Why a staging or development site starts at "What should happen to this copy?".
 *
 * @param c - The copy context.
 * @return The note.
 */
export function getStagingNote( c: CopyContext ): ReactNode {
	return fill(
		c.isStore
			? /* translators: <z />: the address WordPress.com has on record. */
				_x(
					'WordPress marks this as a staging store, so it is treated as a copy of <z />.',
					'WooCommerce store',
					'jetpack-connection-js'
				)
			: /* translators: <z />: the address WordPress.com has on record. */
				__(
					'WordPress marks this as a staging site, so it is treated as a copy of <z />.',
					'jetpack-connection-js'
				),
		c
	);
}

/**
 * That Safe Mode is already on, for a host that keeps the questions once Safe Mode is confirmed.
 *
 * @return The note.
 */
export function getConfirmedNote(): string {
	return __(
		'You chose to stay in Safe Mode. Features stay paused until you choose another option below.',
		'jetpack-connection-js'
	);
}

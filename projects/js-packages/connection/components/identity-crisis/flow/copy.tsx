import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { isIpAddress } from '../../../helpers/format-site-address';
import type { SupportTopic } from '../support-link';
import type { ChoiceStepId, GuideAnswerId, GuideStepId, OptionId, ResultStepId } from './steps';
import type { ReactElement, ReactNode } from 'react';

// Store and Jetpack variants use `_x()`, so minification can't merge them with the `__()` variant into one call.

/** What the flow's text depends on. */
export interface CopyContext {
	isStore: boolean;
	hasJetpackPlugin: boolean;
	/** WordPress takes the address from each request, per `wp-config.php`. */
	isDynamicAddress: boolean;
	/** This site's address, formatted for display. */
	x: string;
	/** The address WordPress.com has on record, formatted for display. */
	z: string;
}

/** A step's button, and its label while the action runs. */
export interface ActionCopy {
	button: string;
	/** Steps that only move on have none. */
	busy?: string;
	/** A link beside the button, which replaces the footer. */
	link?: { text: string; topic: SupportTopic };
}

export interface OptionCopy extends ActionCopy {
	label: ReactNode;
	/** Always shown. */
	hint: ReactNode;
	/** The consequence, shown once the option is selected. */
	more?: ReactNode;
	/** The statement as a sentence, for when the guide reaches it. */
	statement?: ReactNode;
}

/** A guide answer's label and hint. */
export interface GuideAnswerCopy {
	label: ReactNode;
	hint?: ReactNode;
}

/** A guide question, with an optional line of help below it. */
export interface GuideStepCopy {
	title: ReactNode;
	help?: ReactNode;
}

/** One line of "What we already know". */
export interface FactLine {
	key: 'isDynamic' | 'isIpAddress' | 'isDevelopmentSite';
	text: ReactNode;
}

export interface ResultCopy extends ActionCopy {
	/** A line above the title. */
	lead?: string;
	title: ReactNode;
	help: ReactNode;
	/** One line per fact that applies. */
	facts: FactLine[];
	fixes?: { lead: string; items: ReactNode[] };
	/** What staying in Safe Mode means here. */
	more?: ReactNode;
	/** Plain text for the admin to copy and send to their host or developer. */
	message?: { label: string; text: string };
}

/**
 * Fills `<x />` and `<z />` with the addresses as elements, so nothing in an address is parsed as a tag.
 *
 * @param text - The translated text; may also hold `<code>` tags.
 * @param c    - The copy context.
 * @return The text with the addresses in bold.
 */
function fill( text: string, c: CopyContext ): ReactNode {
	return createInterpolateElement( text, {
		x: <strong>{ c.x }</strong>,
		z: <strong>{ c.z }</strong>,
		code: <code />,
	} );
}

/**
 * The question a step asks.
 *
 * @param step - The step.
 * @param c    - The copy context.
 * @return The question.
 */
export function getStepTitle( step: ChoiceStepId, c: CopyContext ): ReactNode {
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
		case 'same':
			return {
				label: c.isStore
					? _x(
							'Another address for this same store',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __( 'Another address for this same site', 'jetpack-connection-js' ),
				hint: fill(
					__(
						'It opens at both. Its address is set dynamically in <code>wp-config.php</code>.',
						'jetpack-connection-js'
					),
					c
				),
				more: c.isStore
					? _x(
							'Next: why WordPress.com sees two stores, and how to fix it.',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __(
							'Next: why WordPress.com sees two sites, and how to fix it.',
							'jetpack-connection-js'
						),
				...next,
			};
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
				statement: fill(
					c.isStore
						? /* translators: <z />: the address WordPress.com has on record. */
							_x(
								'<z /> is this store’s old address',
								'WooCommerce store',
								'jetpack-connection-js'
							)
						: /* translators: <z />: the address WordPress.com has on record. */
							__( '<z /> is this site’s old address', 'jetpack-connection-js' ),
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
				statement: fill(
					c.isStore
						? /* translators: <z />: the address WordPress.com has on record. */
							_x(
								'<z /> is the original store, and this one is a copy',
								'WooCommerce store',
								'jetpack-connection-js'
							)
						: /* translators: <z />: the address WordPress.com has on record. */
							__( '<z /> is the original site, and this one is a copy', 'jetpack-connection-js' ),
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
				statement: fill(
					c.isStore
						? /* translators: <z />: the address WordPress.com has on record. */
							_x( '<z /> is a copy of this store', 'WooCommerce store', 'jetpack-connection-js' )
						: /* translators: <z />: the address WordPress.com has on record. */
							__( '<z /> is a copy of this site', 'jetpack-connection-js' ),
					c
				),
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
 * A result's explanation, the fixes it offers and its button.
 *
 * @param step - The result step.
 * @param c    - The copy context.
 * @return The copy.
 */
export function getResultCopy( step: ResultStepId, c: CopyContext ): ResultCopy {
	switch ( step ) {
		case 'two-addresses':
			return {
				title: c.isStore
					? _x(
							'This is one store with two addresses',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __( 'This is one site with two addresses', 'jetpack-connection-js' ),
				help: c.isStore
					? _x(
							'WordPress.com could not confirm that both addresses are the same store. It has to reach each address to check.',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __(
							'WordPress.com could not confirm that both addresses are the same site. It has to reach each address to check.',
							'jetpack-connection-js'
						),
				facts: getAddressFactLines( c ),
				fixes: {
					lead: __( 'Fix it one of two ways:', 'jetpack-connection-js' ),
					items: [
						fill(
							c.isStore
								? /* translators: <x />: this store's address. <z />: the address WordPress.com has on record. */
									_x(
										'Give the store one fixed address, in <code>wp-config.php</code> or in Settings › General. If you keep <z />, Safe Mode ends by itself. If you keep <x />, come back here and update the address.',
										'WooCommerce store',
										'jetpack-connection-js'
									)
								: /* translators: <x />: this site's address. <z />: the address WordPress.com has on record. */
									__(
										'Give the site one fixed address, in <code>wp-config.php</code> or in Settings › General. If you keep <z />, Safe Mode ends by itself. If you keep <x />, come back here and update the address.',
										'jetpack-connection-js'
									),
							c
						),
						fill(
							/* translators: <x />: this site's address. */
							__(
								'Keep both addresses, and make <x /> reachable from the internet. Then choose Safe Mode in the admin bar to start the checks again. Safe Mode ends once one passes.',
								'jetpack-connection-js'
							),
							c
						),
					],
				},
				link: {
					text: __( 'How to set a fixed address', 'jetpack-connection-js' ),
					topic: 'safe-mode',
				},
				button: __( 'Stay in Safe Mode for now', 'jetpack-connection-js' ),
				busy: __( 'Saving…', 'jetpack-connection-js' ),
			};
		case 'ask': {
			const messageFormat = c.isStore
				? /* translators: %1$s: this store's address. %2$s: the address WordPress.com has on record. */
					_x(
						'My store %1$s shows “Jetpack Connection is in Safe Mode”. WordPress.com has it registered at %2$s. Was the store moved, copied or restored recently? If so, from which address to which?',
						'WooCommerce store',
						'jetpack-connection-js'
					)
				: /* translators: %1$s: this site's address. %2$s: the address WordPress.com has on record. */
					__(
						'My site %1$s shows “Jetpack Connection is in Safe Mode”. WordPress.com has it registered at %2$s. Was the site moved, copied or restored recently? If so, from which address to which?',
						'jetpack-connection-js'
					);
			return {
				title: __( 'Stay in Safe Mode while you find out', 'jetpack-connection-js' ),
				help: c.isStore
					? _x(
							'Nothing changes until you decide. The person who hosts or built this store will know what happened. Payments will not be interrupted.',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __(
							'Nothing changes until you decide. The person who hosts or built this site will know what happened.',
							'jetpack-connection-js'
						),
				facts: [],
				message: {
					label: __( 'Send this to your host or developer', 'jetpack-connection-js' ),
					text: sprintf( messageFormat, c.x, c.z ),
				},
				link: { text: getContactText(), topic: 'contact' },
				button: __( 'Stay in Safe Mode', 'jetpack-connection-js' ),
				busy: __( 'Saving…', 'jetpack-connection-js' ),
			};
		}
		case 'later':
			return {
				title: __( 'Stay in Safe Mode for now', 'jetpack-connection-js' ),
				help: __(
					'You can come back and decide at any time from the admin bar.',
					'jetpack-connection-js'
				),
				facts: [],
				more: getPausedText( c ),
				button: __( 'Stay in Safe Mode', 'jetpack-connection-js' ),
				busy: __( 'Saving…', 'jetpack-connection-js' ),
			};
		default: {
			const unhandled: never = step;
			return unhandled;
		}
	}
}

/**
 * The statement the guide reached and what it will do, for the admin to confirm.
 *
 * @param id - The statement.
 * @param c  - The copy context.
 * @return The copy, with the statement's button.
 */
export function getConclusionCopy( id: OptionId, c: CopyContext ): ResultCopy {
	const { label, statement, more, button, busy } = getOptionCopy( id, c );
	return {
		lead: __( 'From what you saw:', 'jetpack-connection-js' ),
		title: statement ?? label,
		help: more,
		facts: [],
		button,
		busy,
	};
}

/**
 * What the screen can tell from this site's address, one line per fact that applies.
 *
 * @param c - The copy context.
 * @return The lines.
 */
function getAddressFactLines( c: CopyContext ): FactLine[] {
	const lines: FactLine[] = [];
	if ( c.isDynamicAddress ) {
		lines.push( {
			key: 'isDynamic',
			text: fill(
				__(
					'Its address is set dynamically in <code>wp-config.php</code>, so it may be reachable at more than one address.',
					'jetpack-connection-js'
				),
				c
			),
		} );
	}
	if ( isIpAddress( c.x ) ) {
		lines.push( {
			key: 'isIpAddress',
			/* translators: <x />: this site's address. */
			text: fill( __( '<x /> is an IP address.', 'jetpack-connection-js' ), c ),
		} );
	}
	return lines;
}

/**
 * What the first guide question already knows: whether WordPress marks a copy, then the address facts.
 *
 * @param c                 - The copy context.
 * @param isDevelopmentSite - WordPress marks this as a staging or development site.
 * @return The lines.
 */
export function getGuideFactLines( c: CopyContext, isDevelopmentSite: boolean ): FactLine[] {
	// Always "site", also on a store: WordPress marks the installation.
	const marking = isDevelopmentSite
		? __( 'WordPress marks this as a staging site.', 'jetpack-connection-js' )
		: _x(
				'WordPress does not mark this as a staging or development site.',
				'Environment type',
				'jetpack-connection-js'
			);
	return [ { key: 'isDevelopmentSite', text: marking }, ...getAddressFactLines( c ) ];
}

/**
 * The text above the first guide question.
 *
 * @param c - The copy context.
 * @return The text.
 */
export function getGuideIntro( c: CopyContext ): string {
	return c.isStore
		? _x(
				'Nothing breaks while you decide. Payments will not be interrupted. You can stay in Safe Mode at any step.',
				'WooCommerce store',
				'jetpack-connection-js'
			)
		: __(
				'Nothing breaks while you decide. You can stay in Safe Mode at any step.',
				'jetpack-connection-js'
			);
}

/**
 * A guide question and its help.
 *
 * @param step - The guide question.
 * @param c    - The copy context.
 * @return The copy.
 */
export function getGuideStepCopy( step: GuideStepId, c: CopyContext ): GuideStepCopy {
	switch ( step ) {
		case 'open_address':
			return {
				/* translators: <z />: the address WordPress.com has on record. */
				title: fill( __( 'Open <z /> in a new tab. What happens?', 'jetpack-connection-js' ), c ),
			};
		case 'was_it_there':
			return {
				title: fill(
					c.isStore
						? /* translators: <z />: the address WordPress.com has on record. */
							_x(
								'Did this store use to be at <z />?',
								'WooCommerce store',
								'jetpack-connection-js'
							)
						: /* translators: <z />: the address WordPress.com has on record. */
							__( 'Did this site use to be at <z />?', 'jetpack-connection-js' ),
					c
				),
			};
		case 'same_or_separate':
			return {
				title: c.isStore
					? _x(
							'Is it this same store, or a separate one?',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __( 'Is it this same site, or a separate one?', 'jetpack-connection-js' ),
				help: c.isStore
					? _x(
							'Compare today’s orders or the newest product at both addresses.',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __( 'Compare the latest post or page at both addresses.', 'jetpack-connection-js' ),
			};
		case 'visitors_use':
			return {
				title: c.isStore
					? _x( 'Which one do your customers use?', 'WooCommerce store', 'jetpack-connection-js' )
					: __( 'Which one do your visitors use?', 'jetpack-connection-js' ),
			};
		default: {
			const unhandled: never = step;
			return unhandled;
		}
	}
}

/**
 * A guide answer's label and hint.
 *
 * @param id - The answer.
 * @param c  - The copy context.
 * @return The copy.
 */
export function getGuideAnswerCopy( id: GuideAnswerId, c: CopyContext ): GuideAnswerCopy {
	switch ( id ) {
		case 'forwards':
			return {
				/* translators: <x />: this site's address. */
				label: fill( __( 'It brings me back to <x />', 'jetpack-connection-js' ), c ),
				hint: __( 'The old address forwards here.', 'jetpack-connection-js' ),
			};
		case 'nothing':
			return {
				label: c.isStore
					? _x(
							'Nothing loads, or it is not my store',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __( 'Nothing loads, or it is not my site', 'jetpack-connection-js' ),
			};
		case 'loads':
			return {
				label: c.isStore
					? _x( 'A store loads there', 'WooCommerce store', 'jetpack-connection-js' )
					: __( 'A site loads there', 'jetpack-connection-js' ),
				hint: __(
					'It looks like this one, or like an older or newer version of it.',
					'jetpack-connection-js'
				),
			};
		case 'was_there':
			return { label: __( 'Yes, it moved from there', 'jetpack-connection-js' ) };
		case 'not_there':
			return {
				label: __( 'No, or I’m not sure', 'jetpack-connection-js' ),
				hint: fill(
					c.isStore
						? /* translators: <z />: the address WordPress.com has on record. */
							_x(
								'<z /> may be a live store that is down right now.',
								'WooCommerce store',
								'jetpack-connection-js'
							)
						: /* translators: <z />: the address WordPress.com has on record. */
							__( '<z /> may be a live site that is down right now.', 'jetpack-connection-js' ),
					c
				),
			};
		case 'same':
			return {
				label: c.isStore
					? _x( 'The same store', 'WooCommerce store', 'jetpack-connection-js' )
					: __( 'The same site', 'jetpack-connection-js' ),
				hint: __( 'A change made here shows up there too.', 'jetpack-connection-js' ),
			};
		case 'separate':
			return {
				label: c.isStore
					? _x( 'A separate store', 'WooCommerce store', 'jetpack-connection-js' )
					: __( 'A separate site', 'jetpack-connection-js' ),
				hint: __(
					'They differ, or a change made here does not show up there.',
					'jetpack-connection-js'
				),
			};
		case 'unsure':
			return { label: __( 'I’m not sure', 'jetpack-connection-js' ) };
		case 'other_address':
			return {
				label: <strong>{ c.z }</strong>,
				hint: fill(
					/* translators: <x />: this site's address. */
					__( 'This one, <x />, is for testing or development.', 'jetpack-connection-js' ),
					c
				),
			};
		case 'this_address':
			return {
				/* translators: <x />: this site's address. */
				label: fill( __( 'This one, <x />', 'jetpack-connection-js' ), c ),
				hint: fill(
					/* translators: <z />: the address WordPress.com has on record. */
					__( '<z /> is for testing or development.', 'jetpack-connection-js' ),
					c
				),
			};
		default: {
			const unhandled: never = id;
			return unhandled;
		}
	}
}

/**
 * Text for the guide's own controls and links.
 *
 * @param c - The copy context.
 * @return The text, by use.
 */
export function getGuideText( c: CopyContext ) {
	return {
		/* translators: %s: the address WordPress.com has on record, e.g. example.com. */
		openAddress: sprintf( __( 'Open %s', 'jetpack-connection-js' ), c.z ),
		backToStart: __( 'Back to the first screen', 'jetpack-connection-js' ),
		trailLabel: __( 'Your answers:', 'jetpack-connection-js' ),
		/* translators: Read by screen readers before an earlier answer, which the button goes back to. */
		changeAnswer: __( 'Change answer:', 'jetpack-connection-js' ),
		copyMessage: __( 'Copy message', 'jetpack-connection-js' ),
		copied: __( 'Copied', 'jetpack-connection-js' ),
	};
}

/**
 * The label of "Back", which returns to the previous step.
 *
 * @return The text.
 */
export function getBackText(): string {
	return __( 'Back', 'jetpack-connection-js' );
}

/**
 * The name of the list of facts.
 *
 * @return The text.
 */
export function getFactsLabel(): string {
	return __( 'What we already know', 'jetpack-connection-js' );
}

/**
 * The link to contact support.
 *
 * @return The text.
 */
export function getContactText(): string {
	return __( 'Contact support', 'jetpack-connection-js' );
}

/**
 * The footer link to the Safe Mode support page.
 *
 * @return The text.
 */
export function getLearnMoreText(): string {
	return __( 'Learn more about Safe Mode', 'jetpack-connection-js' );
}

/**
 * The footer link that opens the guide, inside its sentence.
 *
 * @param link - The control that opens the guide, wrapping the link text.
 * @return The text.
 */
export function getOpenGuideText( link: ReactElement ): ReactNode {
	return createInterpolateElement(
		__(
			'Something else, or not sure? <guide>Work it out step by step</guide>',
			'jetpack-connection-js'
		),
		{ guide: link }
	);
}

/**
 * The staging note's link that opens the guide.
 *
 * @return The text.
 */
export function getStagingGuideText(): string {
	return __( 'Not a copy? Work it out step by step', 'jetpack-connection-js' );
}

/**
 * The guide footer's way to stop and stay in Safe Mode, inside its sentence.
 *
 * @param link - The control that stays in Safe Mode, wrapping the link text.
 * @return The text.
 */
export function getLaterText( link: ReactElement ): ReactNode {
	return createInterpolateElement(
		__( 'Not ready to decide? <later>Stay in Safe Mode for now</later>', 'jetpack-connection-js' ),
		{ later: link }
	);
}

/**
 * What Safe Mode pauses, on the first view and the "later" result.
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
		/* translators: <z />: the address WordPress.com has on record. */
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

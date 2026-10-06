import { __, sprintf } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { Badge, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, Stat } from '../../components/card';
import SettingsLink from '../../components/settings-link';
import isModuleActive from '../../data/is-module-active';
import type { LoginProtectionContext, ModuleState } from './types';
import type { CardStatus } from '../../components/card';

/**
 * One way of protecting logins, with whether it's on.
 *
 * @param props             - Component props.
 * @param props.name        - The method's name.
 * @param props.description - What it does.
 * @param props.state       - Its module's live state.
 * @return The row.
 */
function Method( {
	name,
	description,
	state,
}: {
	name: string;
	description: string;
	state: ModuleState;
} ) {
	let badge = <Badge intent="draft">{ __( 'Off', 'jetpack' ) }</Badge>;
	if ( ! state.available ) {
		badge = <Badge intent="none">{ __( 'Unavailable', 'jetpack' ) }</Badge>;
	} else if ( state.active ) {
		badge = <Badge intent="stable">{ __( 'On', 'jetpack' ) }</Badge>;
	}

	return (
		<CardRow>
			<Stack direction="row" gap="md" align="center" justify="space-between">
				<Stack direction="column" gap="xs">
					<Text variant="body-lg">{ name }</Text>
					<Text variant="body-md" className="jp-protect-card__muted">
						{ description }
					</Text>
				</Stack>
				{ badge }
			</Stack>
		</CardRow>
	);
}

/**
 * The card badge's intent: neutral when no method is available.
 *
 * @param on        - How many methods are on.
 * @param available - How many methods are available.
 * @return The intent.
 */
function getStatusIntent( on: number, available: number ): CardStatus[ 'intent' ] {
	if ( available === 0 ) {
		return 'none';
	}
	return on === available ? 'stable' : 'medium';
}

/**
 * The Login protection card: brute force protection, account protection and WordPress.com login.
 *
 * @param props              - The dashboard context.
 * @param props.state        - This section's state from PHP.
 * @param props.settings     - Jetpack settings, for live module state.
 * @param props.openSettings - Switches to the Settings tab.
 * @return The card, or nothing without the section's state.
 */
export default function LoginProtectionCard( {
	state: login,
	settings,
	openSettings,
}: LoginProtectionContext ) {
	if ( ! login ) {
		return null;
	}

	const live = ( module: string, initial: ModuleState ): ModuleState => ( {
		available: initial.available,
		active: isModuleActive( settings.settings, module, initial.active ),
	} );
	const bruteForce = live( 'protect', login.bruteForce );
	const accountProtection = live( 'account-protection', login.accountProtection );
	const sso = live( 'sso', login.sso );

	const methods = [ bruteForce, accountProtection, sso ];
	const on = methods.filter( method => method.available && method.active ).length;
	const available = methods.filter( method => method.available ).length;

	return (
		<ProtectCard
			icon={ lock }
			title={ __( 'Login protection', 'jetpack' ) }
			status={ {
				label: sprintf(
					/* translators: %1$d is how many login protections are on, %2$d how many there are. */
					__( '%1$d of %2$d on', 'jetpack' ),
					on,
					available
				),
				intent: getStatusIntent( on, available ),
			} }
		>
			{ bruteForce.active && (
				<CardRow>
					<Stat
						label={ __( 'All-time blocked login attempts', 'jetpack' ) }
						value={ login.blockedCount }
					/>
				</CardRow>
			) }
			<Method
				name={ __( 'Brute force protection', 'jetpack' ) }
				description={ __( 'Blocks IP addresses that keep failing to log in.', 'jetpack' ) }
				state={ bruteForce }
			/>
			<Method
				name={ __( 'Account protection', 'jetpack' ) }
				description={ __(
					'Asks users with a weak or leaked password to verify their identity and choose a new one.',
					'jetpack'
				) }
				state={ accountProtection }
			/>
			<Method
				name={ __( 'WordPress.com login', 'jetpack' ) }
				description={ __(
					'Lets users log in with their WordPress.com account, with optional two-step authentication.',
					'jetpack'
				) }
				state={ sso }
			/>
			<CardRow>
				<SettingsLink onOpen={ openSettings }>
					{ __( 'Configure login protection', 'jetpack' ) }
				</SettingsLink>
			</CardRow>
		</ProtectCard>
	);
}

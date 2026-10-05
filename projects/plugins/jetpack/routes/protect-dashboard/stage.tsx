import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { bug, lock, seen, shield } from '@wordpress/icons';
import ProtectSection from './section';
import './route.scss';
import type { SectionState } from './types';

const UNAVAILABLE: SectionState = { available: false, active: false, url: '' };

/**
 * Badge and link for a section backed by a Jetpack module.
 *
 * @param state - The module's state.
 * @return The section's status and action props.
 */
function moduleProps( state: SectionState ) {
	if ( ! state.available ) {
		return { status: { label: __( 'Unavailable', 'jetpack' ), intent: 'none' as const } };
	}

	return state.active
		? {
				status: { label: __( 'On', 'jetpack' ), intent: 'stable' as const },
				action: { label: __( 'Manage settings', 'jetpack' ), url: state.url },
			}
		: {
				status: { label: __( 'Off', 'jetpack' ), intent: 'draft' as const },
				action: { label: __( 'Turn on in Settings', 'jetpack' ), url: state.url },
			};
}

/**
 * Boot stage for the Protect dashboard: one section per security feature.
 *
 * @return The Protect page.
 */
const Stage = () => {
	const state = window.jetpackProtectDashboard;
	const scan = state?.scan ?? UNAVAILABLE;

	return (
		<Page
			className="jp-protect-dashboard jp-admin-page"
			visual={ <JetpackLogo showText={ false } height={ 20 } /> }
			// "Protect" is a product name and is not translated.
			title="Protect"
			ariaLabel="Protect"
			subTitle={ __(
				'Security tools that keep your site safe and sound, from posts to plugins.',
				'jetpack'
			) }
			hasPadding={ false }
		>
			<div className="jp-protect-dashboard__body">
				<div className="jp-protect-dashboard__sections">
					<ProtectSection
						icon={ bug }
						title={ __( 'Scan', 'jetpack' ) }
						description={ __(
							'Checks your site every day for malware and for known vulnerabilities in WordPress, plugins and themes.',
							'jetpack'
						) }
						status={
							scan.active
								? { label: __( 'Active', 'jetpack' ), intent: 'stable' }
								: { label: __( 'Upgrade', 'jetpack' ), intent: 'informational' }
						}
						action={
							scan.url
								? {
										label: scan.active
											? __( 'View scan results', 'jetpack' )
											: __( 'Get Scan', 'jetpack' ),
										url: scan.url,
										external: scan.active,
									}
								: undefined
						}
					/>
					<ProtectSection
						icon={ seen }
						title={ __( 'Monitor', 'jetpack' ) }
						description={ __(
							'Emails you the moment your site goes down, and again when it is back up.',
							'jetpack'
						) }
						{ ...moduleProps( state?.monitor ?? UNAVAILABLE ) }
					/>
					<ProtectSection
						icon={ shield }
						title={ __( 'Firewall', 'jetpack' ) }
						description={ __(
							'Blocks malicious requests before they reach your site, using automatic rules and IP addresses you choose.',
							'jetpack'
						) }
						{ ...moduleProps( state?.firewall ?? UNAVAILABLE ) }
					/>
					<ProtectSection
						icon={ lock }
						title={ __( 'Login protection', 'jetpack' ) }
						description={ __(
							'Stops brute force attacks by blocking IP addresses that keep failing to log in.',
							'jetpack'
						) }
						{ ...moduleProps( state?.loginProtection ?? UNAVAILABLE ) }
					/>
				</div>
			</div>
			<JetpackFooter />
		</Page>
	);
};

export { Stage as stage };

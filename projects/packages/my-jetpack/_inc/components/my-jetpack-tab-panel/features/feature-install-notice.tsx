import { Text } from '@wordpress/ui';
import clsx from 'clsx';
import { getInstallBlockReason } from './feature-state';
import styles from './styles.module.scss';
import { useInstallError } from './use-main-features';
import type { FeatureState } from './feature-state';

type FeatureInstallNoticeProps = {
	state: FeatureState;
	className?: string;
};

/**
 * Why a feature's plugin can't be installed here, or why the last install failed.
 *
 * @param {FeatureInstallNoticeProps} props           - The component props.
 * @param {FeatureState}              props.state     - Live state for the feature.
 * @param {string}                    props.className - Extra class for the text.
 * @return The rendered component, or null when there is nothing to say.
 */
export function FeatureInstallNotice( { state, className }: FeatureInstallNoticeProps ) {
	const { control } = state;
	let plugin = '';

	if ( control.kind === 'install-plugin' ) {
		plugin = control.plugin;
	} else if ( control.kind === 'install-jetpack' && ! control.installed ) {
		plugin = 'jetpack';
	}

	const error = useInstallError( plugin );
	const blockedReason = getInstallBlockReason( state );

	if ( ! plugin || ( ! blockedReason && ! error ) ) {
		return null;
	}

	return (
		<Text
			variant="body-sm"
			className={ clsx(
				styles[ 'install-notice' ],
				error && ! blockedReason && styles[ 'install-notice--error' ],
				className
			) }
			role={ blockedReason ? undefined : 'alert' }
		>
			{ blockedReason ?? error }
		</Text>
	);
}

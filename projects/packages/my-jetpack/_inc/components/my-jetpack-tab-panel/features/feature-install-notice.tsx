import { Text } from '@wordpress/ui';
import clsx from 'clsx';
import { getInstallBlockReason } from './feature-state';
import styles from './styles.module.scss';
import { useInstallError } from './use-main-features';
import type { FeatureState } from './feature-state';

type FeatureInstallNoticeProps = {
	state: FeatureState;
	className?: string;
	errorsOnly?: boolean;
};

/**
 * Why a feature's plugin can't be installed here, or why the last install failed.
 *
 * @param {FeatureInstallNoticeProps} props            - The component props.
 * @param {FeatureState}              props.state      - Live state for the feature.
 * @param {string}                    props.className  - Extra class for the text.
 * @param {boolean}                   props.errorsOnly - Leave a blocked install to FeatureDelivery.
 * @return The rendered component, or null when there is nothing to say.
 */
export function FeatureInstallNotice( {
	state,
	className,
	errorsOnly = false,
}: FeatureInstallNoticeProps ) {
	const { control } = state;
	const blockedReason = getInstallBlockReason( state );

	if ( blockedReason && errorsOnly ) {
		return null;
	}

	if ( blockedReason ) {
		return (
			<Text variant="body-sm" className={ clsx( styles[ 'install-notice' ], className ) }>
				{ blockedReason }
			</Text>
		);
	}

	// Only cards that offer an install read the mutation cache; module cards never can.
	if ( control.kind === 'install-plugin' ) {
		return <InstallError plugin={ control.plugin } className={ className } />;
	}

	if ( control.kind === 'install-jetpack' && ! control.installed ) {
		return <InstallError plugin="jetpack" className={ className } />;
	}

	return null;
}

type InstallErrorProps = {
	plugin: string;
	className?: string;
};

/**
 * Why the last install of a plugin failed, if it did.
 *
 * @param {InstallErrorProps} props           - The component props.
 * @param {string}            props.plugin    - The plugin's slug, or `jetpack`.
 * @param {string}            props.className - Extra class for the text.
 * @return The rendered component, or null when the last install did not fail.
 */
function InstallError( { plugin, className }: InstallErrorProps ) {
	const error = useInstallError( plugin );

	if ( ! error ) {
		return null;
	}

	return (
		<Text
			variant="body-sm"
			className={ clsx( styles[ 'install-notice' ], styles[ 'install-notice--error' ], className ) }
			role="alert"
		>
			{ error }
		</Text>
	);
}

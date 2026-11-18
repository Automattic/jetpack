import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { hasJetpackPlugin, hasWooPlugin } from '../../../helpers/site-words';
import styles from '../styles.module.scss';
import { getPausedText } from './copy';
import WooIcon from './woo-icon';
import type { CopyContext } from './copy';
import type { ConnectedPlugin } from '../../../helpers/site-words';
import type { ReactNode } from 'react';

/**
 * The connected plugins as chips, with their family's mark.
 *
 * @param {object}            props         - Component props.
 * @param {ConnectedPlugin[]} props.plugins - The connected plugins.
 * @return {ReactNode} The list, or null without plugins.
 */
function ConnectedPlugins( { plugins }: { plugins: ConnectedPlugin[] } ): ReactNode {
	if ( ! plugins.length ) {
		return null;
	}

	return (
		<Stack direction="row" gap="sm" align="center" wrap="wrap">
			<Text variant="body-sm">{ __( 'Connected plugins:', 'jetpack-connection-js' ) }</Text>
			<ul className={ styles.chips }>
				{ plugins.map( plugin => {
					let icon: ReactNode = null;
					if ( hasJetpackPlugin( [ plugin ] ) ) {
						icon = <JetpackLogo showText={ false } height={ 16 } aria-hidden="true" />;
					} else if ( hasWooPlugin( [ plugin ] ) ) {
						icon = <WooIcon />;
					}
					return (
						<li key={ plugin.slug } className={ styles.chip }>
							{ icon }
							{ plugin.name }
						</li>
					);
				} ) }
			</ul>
		</Stack>
	);
}

/**
 * What Safe Mode pauses and which plugins it affects, on the first view.
 *
 * @param {object}            props         - Component props.
 * @param {CopyContext}       props.copy    - The copy context.
 * @param {ConnectedPlugin[]} props.plugins - The connected plugins.
 * @return {ReactNode} The intro.
 */
export default function Intro( {
	copy,
	plugins,
}: {
	copy: CopyContext;
	plugins: ConnectedPlugin[];
} ): ReactNode {
	return (
		<Stack direction="column" gap="sm">
			<Text variant="body-md" render={ <p /> } className={ styles.prose }>
				{ getPausedText( copy ) }
			</Text>
			<ConnectedPlugins plugins={ plugins } />
		</Stack>
	);
}

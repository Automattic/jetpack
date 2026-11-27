import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import styles from '../styles.module.scss';
import { getPausedText } from './copy';
import type { CopyContext } from './copy';
import type { ConnectedPlugin } from '../../../helpers/site-words';
import type { PluginLogos } from '../../../types';
import type { ReactNode } from 'react';

/**
 * The connected plugins as chips, with their logos.
 *
 * @param {object}            props         - Component props.
 * @param {ConnectedPlugin[]} props.plugins - The connected plugins.
 * @param {PluginLogos}       props.logos   - Logo URL by plugin slug.
 * @return {ReactNode} The list, or null without plugins.
 */
function ConnectedPlugins( {
	plugins,
	logos,
}: {
	plugins: ConnectedPlugin[];
	logos?: PluginLogos;
} ): ReactNode {
	if ( ! plugins.length ) {
		return null;
	}

	return (
		<Stack direction="row" gap="sm" align="center" wrap="wrap">
			<Text variant="body-sm">{ __( 'Connected plugins:', 'jetpack-connection-js' ) }</Text>
			<Stack
				render={ <ul /> }
				direction="row"
				gap="xs"
				wrap="wrap"
				className={ styles[ 'plain-list' ] }
			>
				{ plugins.map( ( { slug, name } ) => {
					const logoUrl = logos?.[ slug ];
					return (
						<Text key={ slug } variant="body-sm" render={ <li /> } className={ styles.chip }>
							{ logoUrl && <img src={ logoUrl } alt="" width={ 16 } height={ 16 } /> }
							{ name }
						</Text>
					);
				} ) }
			</Stack>
		</Stack>
	);
}

/**
 * What Safe Mode pauses and which plugins it affects, on the first view.
 *
 * @param {object}            props         - Component props.
 * @param {CopyContext}       props.copy    - The copy context.
 * @param {ConnectedPlugin[]} props.plugins - The connected plugins.
 * @param {PluginLogos}       props.logos   - Logo URL by plugin slug.
 * @return {ReactNode} The intro.
 */
export default function Intro( {
	copy,
	plugins,
	logos,
}: {
	copy: CopyContext;
	plugins: ConnectedPlugin[];
	logos?: PluginLogos;
} ): ReactNode {
	return (
		<Stack direction="column" gap="sm">
			<Text variant="body-md" render={ <p /> } className={ styles.prose }>
				{ getPausedText( copy ) }
			</Text>
			<ConnectedPlugins plugins={ plugins } logos={ logos } />
		</Stack>
	);
}

/* eslint-disable react/jsx-no-bind */

import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import useSeoToolsToggle from '../../data/use-seo-tools-toggle';
import styles from './style.module.scss';
import type { FC } from 'react';

/**
 * Low-emphasis off-ramp shown at the foot of the Overview when SEO tools are
 * active, for sites that use a different SEO solution. Disabling preserves all
 * stored SEO data — re-enabling restores it — so no confirmation is needed.
 * The toggle reloads the page (see `useSeoToolsToggle`).
 *
 * @return The disable-SEO-tools footer.
 */
const DisableSeoTools: FC = () => {
	const { isToggling, setActive } = useSeoToolsToggle();

	return (
		<Text variant="body-md" render={ <div /> } className={ styles.disable }>
			{ __( 'Using a different SEO solution?', 'jetpack-seo' ) }{ ' ' }
			<Button
				variant="link"
				onClick={ () => setActive( false ) }
				isBusy={ isToggling }
				disabled={ isToggling }
			>
				{ __( 'Disable Jetpack SEO tools', 'jetpack-seo' ) }
			</Button>
		</Text>
	);
};

export default DisableSeoTools;

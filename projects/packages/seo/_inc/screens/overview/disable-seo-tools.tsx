/* eslint-disable react/jsx-no-bind */

import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import useSeoToolsToggle from '../../data/use-seo-tools-toggle';
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
		<div className="jetpack-seo-overview__disable">
			<span>{ __( 'Using a different SEO solution?', 'jetpack-seo' ) }</span>{ ' ' }
			<Button
				variant="link"
				onClick={ () => setActive( false ) }
				isBusy={ isToggling }
				disabled={ isToggling }
			>
				{ __( 'Disable Jetpack SEO tools', 'jetpack-seo' ) }
			</Button>
		</div>
	);
};

export default DisableSeoTools;

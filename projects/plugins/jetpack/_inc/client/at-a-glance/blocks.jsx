import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import DashItem from 'components/dash-item';
import React from 'react';

const DashBlocks = () => {
	const labelName = __( 'Jetpack blocks', 'jetpack' );
	const support = {
		text: __(
			'Jetpack includes some blocks which can help you create your pages exactly the way you want them.',
			'jetpack'
		),
		link: getRedirectUrl( 'jetpack-support-blocks' ),
	};

	return (
		<DashItem label={ labelName } support={ support }>
			<p className="jp-dash-item__description">
				{ __(
					'Jetpack blocks give you the power to deliver quality content that hooks website visitors without needing to hire a developer or learn a single line of code.',
					'jetpack'
				) }
			</p>
		</DashItem>
	);
};

export default DashBlocks;

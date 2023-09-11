import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { FC } from 'react';
import autorenewIcon from '../icons/autorenew.svg';
import cloudDoneIcon from '../icons/cloud-done.svg';
import groupWorkIcon from '../icons/group-work.svg';
import historyIcon from '../icons/history.svg';

import './style.scss';

const WhyINeedVPBackup: FC = () => {
	return (
		<div className="jp-backup-why-i-need-vp">
			<h2 className="jp-backup-why-i-need-vp__title">
				{ createInterpolateElement(
					__(
						'My host provides backups for my site.<br/>Why do I need VaultPress Backup?',
						'jetpack-backup-pkg'
					),
					{ br: <br /> }
				) }
			</h2>

			<div className="jp-backup-why-i-need-vp__reasons">
				<div className="jp-backup-why-i-need-vp__reason_section">
					<img src={ cloudDoneIcon } alt="" />

					<span>{ __( 'Safely stored in the cloud', 'jetpack-backup-pkg' ) }</span>

					<p>
						{ __(
							'VaultPress Backup stores multiple copies of your backups in the cloud, so if your host goes down (with their backups), your backups with us will be safe and sound.',
							'jetpack-backup-pkg'
						) }
					</p>
				</div>

				<div className="jp-backup-why-i-need-vp__reason_section">
					<img src={ autorenewIcon } alt="" />

					<span>{ __( 'Real-time backups', 'jetpack-backup-pkg' ) }</span>

					<p>
						{ __(
							'Most hosts back up your site once a day. VaultPress Backup saves every change you make in real-time, so you can quickly revert to any update you made with ease.',
							'jetpack-backup-pkg'
						) }
					</p>
				</div>

				<div className="jp-backup-why-i-need-vp__reason_section">
					<img src={ historyIcon } alt="" />

					<span>{ __( 'One-click restores from anywhere', 'jetpack-backup-pkg' ) }</span>

					<p>
						{ __(
							'You can easily restore your site in one click, if needed, with VaultPress Backup from desktop or our mobile app.',
							'jetpack-backup-pkg'
						) }
					</p>
				</div>

				<div className="jp-backup-why-i-need-vp__reason_section">
					<img src={ groupWorkIcon } alt="" />

					<span>{ __( 'Integrated, and easy to use', 'jetpack-backup-pkg' ) }</span>

					<p>
						{ __(
							'VaultPress Backup is built specifically for WordPress & WooCommerce and is incredibly easy to use; no developer required.',
							'jetpack-backup-pkg'
						) }
					</p>
				</div>
			</div>
		</div>
	);
};

export { WhyINeedVPBackup };

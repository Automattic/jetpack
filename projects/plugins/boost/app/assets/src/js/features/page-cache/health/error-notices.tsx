import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import styles from './health.module.scss';
import { __, sprintf } from '@wordpress/i18n';
import { Notice, Link } from '@wordpress/ui';
import { PageCacheError } from '$lib/stores/page-cache';
import { ReactNode } from 'react';

type NoticeProps = {
	onClose: () => void;
};

const cacheIssuesLink = ( issue: string ) => {
	return getRedirectUrl( `jetpack-boost-cache-issue-${ issue }` );
};

const dismissLabel = () => __( 'Dismiss', 'jetpack-boost' );

export const FailedSettingsWriteNotice = ( { onClose }: NoticeProps ) => {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>{ __( 'The settings file cannot be updated', 'jetpack-boost' ) }</Notice.Title>
			<Notice.Description>
				<p>
					{ createInterpolateElement(
						__(
							`This feature cannot be enabled because Jetpack Boost cannot update its settings. To learn more about this, please <link>click here.</link>`,
							'jetpack-boost'
						),
						{
							link: <Link openInNewTab href={ cacheIssuesLink( 'failed-settings-write' ) } />,
						}
					) }
				</p>
			</Notice.Description>
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

export const WPContentNotWritableNotice = ( { onClose }: NoticeProps ) => {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>
				{ sprintf(
					// translators: %s refers to wp-content.
					__( `Your site's %s folder doesn't allow updates`, 'jetpack-boost' ),
					'wp-content'
				) }
			</Notice.Title>
			<Notice.Description>
				<p>
					{ createInterpolateElement(
						sprintf(
							// translators: %s refers to wp-content.
							__(
								`This feature cannot be enabled because Jetpack Boost cannot create or modify files in <code>%s</code>. To learn more about this, please <link>click here.</link>`,
								'jetpack-boost'
							),
							'wp-content'
						),
						{
							code: <code className={ styles.nowrap } />,
							link: <Link openInNewTab href={ cacheIssuesLink( 'wp-content-not-writable' ) } />,
						}
					) }
				</p>
			</Notice.Description>
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

export const NotUsingPermalinksNotice = ( { onClose }: NoticeProps ) => {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>{ __( 'Permalink settings must be updated', 'jetpack-boost' ) }</Notice.Title>
			<Notice.Description>
				<p>
					{ createInterpolateElement(
						__(
							'To activate this feature, your site needs to use a different URL structure instead of the current Plain (default) permalinks. To learn more, please <link>click here.</link>',
							'jetpack-boost'
						),
						{
							link: <Link openInNewTab href={ cacheIssuesLink( 'not-using-permalinks' ) } />,
						}
					) }
				</p>
			</Notice.Description>
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

export const AdvancedCacheIncompatibleNotice = ( { onClose }: NoticeProps ) => {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>{ __( 'Existing Cache System Detected', 'jetpack-boost' ) }</Notice.Title>
			<Notice.Description>
				<p>
					{ createInterpolateElement(
						__(
							`This feature cannot be enabled because your site is already using a caching system, installed by another plugin or your hosting provider. For a unified optimization experience with Jetpack Boost, please deactivate the current caching solution by disabling the plugin or contacting your hosting support for assistance. If you already did that, try enabling caching again. <link>Learn More.</link>`,
							'jetpack-boost'
						),
						{
							link: <Link openInNewTab href={ cacheIssuesLink( 'advanced-cache-incompatible' ) } />,
						}
					) }
				</p>
			</Notice.Description>
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

type AdvancedCacheForSuperCacheNoticeProps = {
	actions: ReactNode[];
} & NoticeProps;

export const AdvancedCacheForSuperCacheNotice = ( {
	actions,
	onClose,
}: AdvancedCacheForSuperCacheNoticeProps ) => {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>{ __( 'Existing Cache System Detected', 'jetpack-boost' ) }</Notice.Title>
			<Notice.Description>
				<p>
					{ createInterpolateElement(
						__(
							`This feature can't be activated because a caching system is already in place with WP Super Cache. <link>Learn more</link>`,
							'jetpack-boost'
						),
						{
							code: <code className={ styles.nowrap } />,
							link: (
								<Link openInNewTab href={ cacheIssuesLink( 'advanced-cache-for-super-cache' ) } />
							),
						}
					) }
				</p>
			</Notice.Description>
			{ actions && actions.length > 0 && <Notice.Actions>{ actions }</Notice.Actions> }
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

export const UnableToWriteToAdvancedCacheNotice = ( { onClose }: NoticeProps ) => {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>{ __( 'File Update Needed for Activation', 'jetpack-boost' ) }</Notice.Title>
			<Notice.Description>
				<p>
					{ createInterpolateElement(
						__(
							`Jetpack Boost cannot activate this feature because it does not have permission to update a necessary file on your site. To learn more, please <link>click here.</link>`,
							'jetpack-boost'
						),
						{
							link: (
								<Link
									openInNewTab
									href={ cacheIssuesLink( 'unable-to-write-to-advanced-cache' ) }
								/>
							),
						}
					) }
				</p>
			</Notice.Description>
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

export const WPCacheDefinedNotTrueNotice = ( { onClose }: NoticeProps ) => {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>
				{ __( 'The WordPress cache constant must be updated', 'jetpack-boost' ) }
			</Notice.Title>
			<Notice.Description>
				<p>
					{ createInterpolateElement(
						sprintf(
							// translators: %1$s refers to the cache constant (WP_CACHE). %2$s refers to what it isn't set to (true).
							__(
								`Jetpack Boost needs a specific setting to be activated for caching to work properly. Currently, the setting named <code>%1$s</code> is not correctly configured on your site. It should be set to <code>%2$s</code> to enable caching. <link>Click here for easy instructions on how to fix this.</link>`,
								'jetpack-boost'
							),
							'WP_CACHE',
							'true'
						),
						{
							code: <code className={ styles.nowrap } />,
							link: <Link openInNewTab href={ cacheIssuesLink( 'wp-cache-defined-not-true' ) } />,
						}
					) }
				</p>
			</Notice.Description>
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

export const PageCacheRootDirNotWritableNotice = ( { onClose }: NoticeProps ) => {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>
				{ __( 'Cannot create files in cache directory', 'jetpack-boost' ) }
			</Notice.Title>
			<Notice.Description>
				<p>
					{ createInterpolateElement(
						sprintf(
							// translators: %s refers to the cache directory.
							__(
								`Jetpack Boost can't enable caching because it doesn't have permission to write to the cache directory at <code>%s</code>. To fix this, the directory needs to be made writable. This change is necessary for caching to work and speed up your site.`,
								'jetpack-boost'
							),
							'wp-content/boost-cache'
						),
						{
							code: <code className={ styles.nowrap } />,
						}
					) }
				</p>
			</Notice.Description>
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

export const WPConfigNotWritableNotice = ( { onClose }: NoticeProps ) => {
	return (
		<Notice.Root intent="warning">
			<Notice.Title>
				{ __( 'The configuration file cannot be updated', 'jetpack-boost' ) }
			</Notice.Title>
			<Notice.Description>
				<p>
					{ createInterpolateElement(
						sprintf(
							// translators: %s refers to wp-config.php.
							__(
								`The configuration file, <code>%s</code>, is not writable. This file must be writable to activate caching. For instructions on how to make this change, <link>please click here.</link>`,
								'jetpack-boost'
							),
							'wp-config.php'
						),
						{
							code: <code className={ styles.nowrap } />,
							link: <Link openInNewTab href={ cacheIssuesLink( 'wp-config-not-writable' ) } />,
						}
					) }
				</p>
			</Notice.Description>
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

type GenericErrorNoticeProps = {
	error: PageCacheError & object;
} & NoticeProps;

export const GenericErrorNotice = ( { error, onClose }: GenericErrorNoticeProps ) => {
	let title = __( 'Unknown error', 'jetpack-boost' );
	if ( error.code && error.code !== error.message ) {
		title += ` (${ error.code })`;
	}

	return (
		<Notice.Root intent="error">
			<Notice.Title>{ title }</Notice.Title>
			<Notice.Description>{ error.message }</Notice.Description>
			<Notice.CloseIcon onClick={ onClose } label={ dismissLabel() } />
		</Notice.Root>
	);
};

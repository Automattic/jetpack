import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';

const Stage = () => {
	// "VaultPress Backup" is a product name, do not translate.
	return (
		<Page
			title="VaultPress Backup"
			subTitle={ __(
				'Save changes and restore quickly with one-click recovery.',
				'jetpack-backup-pkg'
			) }
			hasPadding={ false }
		/>
	);
};

export { Stage as stage };

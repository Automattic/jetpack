import { __ } from '@wordpress/i18n';

const Stage = () => {
	return <h1>{ __( 'Backup', 'jetpack-backup-pkg' ) }</h1>;
};

export { Stage as stage };

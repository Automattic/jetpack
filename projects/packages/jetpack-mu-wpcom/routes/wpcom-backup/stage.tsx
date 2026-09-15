import { App } from '../../src/features/wpcom-simple-backup/js/app.tsx';
import './style.scss';

// The wp-build route entry; state comes from PHP, so there is no provider to mount.
const Stage = () => {
	return <App />;
};

export { Stage as stage };

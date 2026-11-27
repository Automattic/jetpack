import { useSelector, getSelectedSite } from '../../compat/state';
import { isRunningInWpAdmin } from '../utils';

const useIsRunningInWpAdmin = (): boolean => {
	const site = useSelector( getSelectedSite );
	return isRunningInWpAdmin( site );
};

export default useIsRunningInWpAdmin;

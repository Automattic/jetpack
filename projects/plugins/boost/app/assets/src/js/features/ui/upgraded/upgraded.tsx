import { __ } from '@wordpress/i18n';
import Pill from '$features/ui/pill/pill';

const Upgraded = () => <Pill text={ __( 'Upgraded', 'jetpack-boost' ) } altVersion={ true } />;

export default Upgraded;

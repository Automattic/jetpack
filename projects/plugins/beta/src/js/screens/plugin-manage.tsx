/**
 * PluginManage screen stub — replaced in Task 7.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

type Props = {
	slug: string;
};

/**
 * Stub component for the plugin manage screen.
 *
 * @param {Props} _props - Component props (unused in stub).
 * @return The stub element.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PluginManage = ( _props: Props ) => {
	return <p>{ __( 'Loading…', 'jetpack-beta' ) }</p>;
};

export default PluginManage;

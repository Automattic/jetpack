import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { childBlocks } from './child-blocks';
import { name, settings } from '.';

const isFormsPackageEnabled = getJetpackData()?.jetpack?.is_form_package_enabled ?? false;

if ( ! isFormsPackageEnabled ) {
	registerJetpackBlock( name, settings, childBlocks );
}

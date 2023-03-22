import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import { YoastPromo } from '.';
import './editor.scss';

registerJetpackPlugin( 'yoast-promo', { render: YoastPromo } );

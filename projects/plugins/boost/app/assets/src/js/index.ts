import App from './Main.svelte';
import '../css/admin-style.scss';

const target = document.getElementById( 'jb-admin-settings' );
const app = new App( { target } );

export default app;

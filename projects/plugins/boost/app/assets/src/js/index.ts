import Main from './Main.svelte';
import '../css/admin-style.scss';

const target = document.getElementById( 'jb-admin-settings' );
const app = new Main( { target } );

export default app;

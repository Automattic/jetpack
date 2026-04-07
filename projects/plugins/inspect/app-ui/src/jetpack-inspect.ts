import { mount } from 'svelte';
import Main from './Main.svelte';
import '../css/style.scss';

const target = document.getElementById( 'jetpack-inspect' ) as HTMLElement;
const app = mount( Main, { target } );

export default app;

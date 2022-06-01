import Link from 'svelte-navigator/src/Link.svelte';
import Route from 'svelte-navigator/src/Route.svelte';
import Router from 'svelte-navigator/src/Router.svelte';

/*
 * If imported in a component as `import { Router, Route, Link } from 'svelte-navigator';` there is a conflict on
 * svelte version as svelte-navigator is expecting 3.31.2. The rest of the project is using newer version of svelte.
 * This is a workaround to import svelte-navigator as a dependency using compatible version of svelte.
 */
export { Router, Route, Link };

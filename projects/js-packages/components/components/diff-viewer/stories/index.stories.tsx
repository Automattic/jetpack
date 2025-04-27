import React from 'react';
import DiffViewer from '../index.tsx';

export default {
	title: 'JS Packages/Components/Diff Viewer',
	component: DiffViewer,
};

const diff = `diff --git a/package.json b/package.json
Index: a31e51f..c3b21a1 100644
--- a/package.json
+++ b/package.json
@@ -1,7 +1,7 @@
 {
   "name": "hello-world",
-  "version": "1.0.0",
+  "version": "1.0.1",
   "description": "Hello, World!",
-  "main": "index.js",
+  "main": "index.ts",
   "scripts": {
-     "start": "node index.js"
+     "start": "node index.ts"

diff --git a/src/index.js b/src/index.ts
Index: 17c882a..d3f041b 100644
--- a/src/index.js
+++ b/src/index.ts
@@ -0,0 +1,1 @@
+console.log( 'Hello, world!' );`;

const Template = args => <DiffViewer { ...args } />;

export const Default = Template.bind( {} );

Default.args = {
	diff,
};

/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import DiffViewer from '../index.jsx';

export default {
	title: 'Plugins/Protect/Diff Viewer',
	component: DiffViewer,
};

const diff = `index 51455bdb14..bc0622d001 100644
--- a/circle.yml
+++ b/circle.yml
@@ -1,6 +1,6 @@
 machine:
   node:
-    version: 8.9.4
+    version: 8.11.0
 test:
   pre:
     - ? |`;

export const Default = () => <DiffViewer diff={ diff } />;

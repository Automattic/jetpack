Steps for adding a new route to `projects/packages/premium-analytics`:

1. Create `routes/<name>/`
2. Add `package.json`:
   ```json
   {
     "private": true,
     "name": "_@jetpack-premium-analytics/<name>-route",
     "route": {
       "path": "/<path>",
       "page": "jetpack-premium-analytics"
     }
   }
   ```
3. Add `stage.tsx` exporting `stage()`
4. Run build
5. Verify route loads in `wp-admin` without blank screen
6. Add sidebar entry only if path matches an existing route

# Jetpack Forms Dashboard

This is the React-app implementation for the new Jetpack Forms dashboard.

## Directory structure

```
.
├── components/                     - Reusable components without any state dependencies.
│                                     Could eventually be migrated to @automattic/jetpack-components.
├── data/                           - REST API abstraction layer.
├── inbox/                          - Inbox view implementation.
├── landing/                        - Landing page view implementation.
├── state/                          - App state.
├── index.js                        - App entrypoint.
├── style.wpcom.scss 	            - Style overrides for WordPress.com.
├── class-dashboard.php             - Jetpack Forms WP Admin setup.
└── class-dashboard-view-switch.php - Feedback view toggle implementation.
```

*\**: All views get their own dedicated directory while reusable components go into `components/`.  
*\*\**: Styles usually live next to the components they're used in, with the exception of WP.com style overrides which are handled globally from `style.wpcom.scss`.

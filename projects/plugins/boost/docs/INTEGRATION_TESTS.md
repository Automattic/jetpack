# Integration Tests

To run the integration tests: 
```
npm run test:integration:all
```

This command will:
 - start the test Docker environment
 - deactivate the WordPress test site
 - activate the WordPress test site
 - activate the required plugins
 - run the integration tests (using Jest)
 - stop the test Docker environment

Alternatively you can do:

- `npm run test:env-start` to start the test Docker environment
- `npm run test:integration:run` to deactivate the test WordPress site, activate the WordPress test site and activate the required plugins and run the integration tests (using Jest)
- `npm run test:env-stop` to stop the test Docker environment

// Shared test setup. Database tests use a real local Postgres (TEST_DATABASE_URL).
process.env.TEST_DATABASE_URL ??= "postgres://localhost/jassist_test";
process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret-123";

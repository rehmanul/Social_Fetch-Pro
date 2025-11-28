# Test Documentation

## Overview

Comprehensive test suite for the TikTok Business API integration and route handlers. The tests use Vitest as the test runner with full mocking capabilities for external dependencies.

## Test Structure

### Test Files

- **`server/tiktok-api.test.ts`**: Unit tests for the TikTok API module
- **`server/routes.test.ts`**: Integration tests for TikTok route handlers
- **`vitest.config.ts`**: Vitest configuration
- **`test-setup.ts`**: Global test setup and teardown

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

## Test Coverage

### TikTok API Module (`tiktok-api.test.ts`)

#### Token Management Functions
- ✅ `readTikTokTokens()` - Reading tokens from file system
  - Returns null when file doesn't exist
  - Parses and returns token bundle when file exists
  - Handles JSON parsing errors gracefully

- ✅ `writeTikTokTokens()` - Writing tokens to file system
  - Creates data directory if it doesn't exist
  - Writes token bundle as formatted JSON
  - Returns the written token bundle

#### Configuration Functions
- ✅ `getTikTokBaseUrl()` - Determining API base URL
  - Uses explicit TIKTOK_API_BASE when set
  - Returns sandbox URL when TIKTOK_USE_SANDBOX is true
  - Returns production URL by default

- ✅ `buildTikTokAuthUrl()` - Building OAuth authorization URL
  - Validates required environment variables
  - Builds URL with default state
  - Builds URL with custom state

#### Token Validation
- ✅ `isAccessTokenExpired()` - Checking token expiration
  - Returns false when expiresAt is not set
  - Returns false for valid tokens
  - Returns true for expired tokens
  - Returns true for tokens expiring within 60 seconds

#### OAuth Flow Functions
- ✅ `exchangeAuthCode()` - Exchanging authorization code for tokens
  - Validates required configuration
  - Exchanges auth code successfully
  - Fetches advertiser IDs after exchange
  - Handles API errors

- ✅ `refreshTikTokToken()` - Refreshing expired tokens
  - Validates refresh token availability
  - Uses manual refresh token when provided
  - Uses stored refresh token
  - Falls back to environment variable
  - Preserves advertiser IDs from previous token

#### Token Management
- ✅ `ensureAccessToken()` - Ensuring valid access token
  - Returns existing token when valid
  - Refreshes expired token automatically
  - Falls back to environment token
  - Throws error when no token available

#### API Functions
- ✅ `fetchAdvertiserInfo()` - Fetching advertiser information
  - Uses provided advertiser ID
  - Falls back to environment advertiser ID
  - Uses first advertiser from token bundle
  - Handles missing advertiser ID error

- ✅ `tiktokStatus()` - Getting TikTok integration status
  - Returns complete status with stored token
  - Returns status without token
  - Indicates sandbox mode correctly

### Route Handlers (`routes.test.ts`)

#### TikTok OAuth Routes
- ✅ `GET /api/tiktok/auth-url` - Generate authorization URL
  - Returns URL with default state
  - Returns URL with custom state
  - Handles configuration errors

- ✅ `GET /oauth-callback` - Handle OAuth callback
  - Exchanges auth code successfully
  - Handles both auth_code and code parameters
  - Shows error for authorization failures
  - Validates auth code presence
  - Handles exchange failures gracefully

#### TikTok Management Routes
- ✅ `GET /api/tiktok/status` - Get integration status
  - Returns complete status information

- ✅ `POST /api/tiktok/token/refresh` - Refresh access token
  - Refreshes without manual token
  - Refreshes with manual token
  - Handles refresh failures

- ✅ `POST /api/tiktok/advertiser/info` - Get advertiser information
  - Fetches without specific advertiser ID
  - Fetches with specific advertiser ID
  - Handles fetch failures

#### TikTok Data Routes
- ✅ `GET /api/tiktok` - Scrape TikTok data with pagination
  - Validates username parameter
  - Uses default pagination (page=1, per-page=10)
  - Handles custom pagination parameters
  - Supports both per-page and per_page parameters
  - Caps per-page at 50 items
  - Handles invalid page numbers
  - Returns empty data for out-of-range pages
  - Handles scraping errors
  - Handles empty results

#### Statistics Route
- ✅ `GET /api/stats` - Get application statistics
  - Includes TikTok in active accounts when token exists
  - Excludes TikTok when no token stored

## Mocking Strategy

### External Dependencies
All external dependencies are mocked to ensure tests run in isolation:

- **axios**: Mocked for all HTTP requests to TikTok API
- **fs**: Mocked for file system operations
- **storage**: Mocked for database operations
- **scrapers**: Mocked for scraping functions

### Mock Helpers
- `createMockTokenBundle()`: Helper function to create consistent test token data
- Mock implementations reset between tests using `beforeEach()` and `afterEach()`

## Test Environment

### Configuration
- **Environment**: Node.js
- **Globals**: Enabled for describe, it, expect
- **Coverage**: V8 provider with HTML, JSON, and text reporters
- **Excluded from coverage**: node_modules, dist, client, config files, test files

### Setup
- Console methods are mocked to reduce noise during tests
- Environment variables are preserved and restored for each test
- All mocks are cleared after each test

## Best Practices Demonstrated

1. **Comprehensive Coverage**: All exported functions have test coverage
2. **Edge Cases**: Tests include error scenarios, missing data, and invalid inputs
3. **Isolation**: Each test runs independently with fresh mocks
4. **Readable**: Clear test descriptions and well-organized test suites
5. **Maintainable**: Helper functions and consistent patterns

## Error Scenarios Tested

- Missing environment variables
- Network failures
- Invalid token responses
- Expired tokens
- Missing refresh tokens
- Invalid JSON parsing
- File system errors
- API rate limits

## Integration Points

The tests verify integration between:
- TikTok OAuth flow
- Token persistence
- API authentication
- Route handlers
- Error handling
- Status reporting

## Future Enhancements

Consider adding:
- E2E tests for complete OAuth flow
- Performance benchmarks
- Load testing for pagination
- Mock TikTok API server for integration tests
- Snapshot testing for response structures

## Troubleshooting

### Common Issues

1. **Tests fail with "Cannot find module"**
   - Run `npm install` to install test dependencies

2. **Coverage reports missing**
   - Run `npm run test:coverage` instead of `npm test`

3. **Tests timeout**
   - Check async operations have proper mocks
   - Increase timeout in vitest.config.ts if needed

4. **Environment variable conflicts**
   - Tests preserve and restore process.env
   - Check test-setup.ts for initialization

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all branches are covered
3. Mock external dependencies
4. Follow existing test patterns
5. Update this documentation
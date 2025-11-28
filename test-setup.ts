import { vi } from "vitest";

// Setup test environment
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  };
});

// Clean up after tests
afterAll(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});
/**
 * Simple Request Manager (No Proxy Dependencies)
 *
 * Direct HTTP requests with enhanced headers and retry logic
 * No external proxy services required - uses cookies for authentication
 */

import axios, { AxiosRequestConfig } from "axios";

interface RequestStrategy {
  name: string;
  successCount: number;
  failureCount: number;
  lastUsed: number;
  avgResponseTime: number;
}

interface EnhancedRequestConfig extends AxiosRequestConfig {
  maxRetries?: number;
  retryStrategies?: boolean;
}

interface RequestResult {
  data: any;
  strategy: string;
  responseTime: number;
  headers?: any;
}

class SimpleRequestManager {
  private strategies: Map<string, RequestStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
    console.log("✅ SimpleRequestManager: Initialized (no proxy dependencies)");
  }

  private initializeStrategies() {
    this.strategies.set("direct", {
      name: "Direct Request",
      successCount: 0,
      failureCount: 0,
      lastUsed: 0,
      avgResponseTime: 0,
    });
  }

  /**
   * Make HTTP request with enhanced headers and retry logic
   */
  async makeRequest(url: string, config: EnhancedRequestConfig = {}): Promise<RequestResult> {
    const maxRetries = config.maxRetries ?? 2;
    const retryStrategies = config.retryStrategies ?? true;

    let lastError: Error | null = null;

    // Always try direct request first
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.makeDirectRequest(url, config);
        return result;
      } catch (error: any) {
        console.warn(`🔄 Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
        lastError = error;

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    throw lastError || new Error("Request failed after all retries");
  }

  /**
   * Make direct HTTP request with enhanced browser headers
   */
  private async makeDirectRequest(url: string, config: AxiosRequestConfig): Promise<RequestResult> {
    const startTime = Date.now();
    const strategy = this.strategies.get("direct")!;

    try {
      // Enhanced headers to mimic real browser
      const enhancedHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        ...config.headers,
      };

      const response = await axios({
        ...config,
        url,
        headers: enhancedHeaders,
        timeout: config.timeout || 30000,
        validateStatus: () => true, // Don't throw on any status code
      });

      const responseTime = Date.now() - startTime;

      // Update strategy statistics
      strategy.successCount++;
      strategy.lastUsed = Date.now();
      strategy.avgResponseTime =
        (strategy.avgResponseTime * (strategy.successCount - 1) + responseTime) / strategy.successCount;

      console.log(`✅ Direct request successful (${responseTime}ms)`);

      return {
        data: response.data,
        strategy: "direct",
        responseTime,
        headers: response.headers,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Update failure statistics
      strategy.failureCount++;
      strategy.lastUsed = Date.now();

      console.error(`❌ Direct request failed (${responseTime}ms):`, error.message);
      throw error;
    }
  }

  /**
   * Get request statistics
   */
  getStatistics(): Record<string, RequestStrategy> {
    const stats: Record<string, RequestStrategy> = {};
    this.strategies.forEach((strategy, name) => {
      stats[name] = { ...strategy };
    });
    return stats;
  }

  /**
   * Check if proxy is available (always false for simple manager)
   */
  isBrightDataAvailable(): boolean {
    return false;
  }
}

// Export singleton instance
export const proxyManager = new SimpleRequestManager();

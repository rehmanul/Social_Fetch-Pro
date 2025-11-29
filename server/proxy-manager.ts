/**
 * Advanced Proxy Management System
 *
 * Features:
 * - Intelligent fallback between direct and proxy connections
 * - Enhanced browser fingerprinting to avoid detection
 * - Request strategy tracking and optimization
 * - Automatic retry with different methods
 */

import axios, { AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

interface RequestStrategy {
  name: string;
  successCount: number;
  failureCount: number;
  lastUsed: number;
  avgResponseTime: number;
}

interface EnhancedRequestConfig extends AxiosRequestConfig {
  useBrightData?: boolean;
  maxRetries?: number;
  retryStrategies?: boolean;
}

class ProxyManager {
  private strategies: Map<string, RequestStrategy> = new Map();
  private readonly brightDataUrl: string | undefined;
  private readonly useBrightDataDefault: boolean;

  constructor() {
    // Convert WebSocket browser URL to HTTP proxy URL
    const browserUrl = process.env.BRIGHTDATA_BROWSER_URL;
    if (browserUrl && browserUrl.startsWith("wss://")) {
      // Extract credentials and host from wss://username:password@host:port
      const match = browserUrl.match(/wss:\/\/([^@]+)@([^:]+):(\d+)/);
      if (match) {
        const [, credentials, host] = match;
        // Use standard Bright Data HTTP proxy port (22225)
        this.brightDataUrl = `http://${credentials}@${host}:22225`;
        console.log("🔄 ProxyManager: Converted Bright Data URL to HTTP proxy format");
      } else {
        this.brightDataUrl = undefined;
        console.log("⚠️  ProxyManager: Failed to parse Bright Data URL");
      }
    } else {
      this.brightDataUrl = process.env.BRIGHTDATA_PROXY_URL || browserUrl;
      if (this.brightDataUrl) {
        console.log("🔄 ProxyManager: Using proxy URL from BRIGHTDATA_PROXY_URL");
      }
    }
    this.useBrightDataDefault = process.env.USE_BRIGHTDATA === "true";
    console.log(`🔄 ProxyManager initialized: Bright Data ${this.brightDataUrl ? "available" : "not available"}, default: ${this.useBrightDataDefault ? "proxy" : "direct"}`);
  }

  /**
   * Get realistic browser headers with proper fingerprinting
   */
  private getEnhancedHeaders(referer?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "User-Agent": this.getRotatingUserAgent(),
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    };

    if (referer) {
      headers.Referer = referer;
      headers["Sec-Fetch-Site"] = "same-origin";
    }

    return headers;
  }

  /**
   * Rotate between different realistic user agents
   */
  private getRotatingUserAgent(): string {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    ];

    const index = Math.floor(Math.random() * userAgents.length);
    return userAgents[index];
  }

  /**
   * Track strategy performance for intelligent selection
   */
  private updateStrategy(strategyName: string, success: boolean, responseTime: number): void {
    let strategy = this.strategies.get(strategyName);

    if (!strategy) {
      strategy = {
        name: strategyName,
        successCount: 0,
        failureCount: 0,
        lastUsed: Date.now(),
        avgResponseTime: 0,
      };
      this.strategies.set(strategyName, strategy);
    }

    if (success) {
      strategy.successCount++;
    } else {
      strategy.failureCount++;
    }

    strategy.avgResponseTime =
      (strategy.avgResponseTime * (strategy.successCount + strategy.failureCount - 1) + responseTime) /
      (strategy.successCount + strategy.failureCount);
    strategy.lastUsed = Date.now();
  }

  /**
   * Get the best strategy based on historical performance
   */
  private getBestStrategy(): string {
    if (this.strategies.size === 0) {
      return this.useBrightDataDefault ? "proxy" : "direct";
    }

    let bestStrategy: RequestStrategy | null = null;
    let bestScore = -1;

    for (const strategy of Array.from(this.strategies.values())) {
      const total = strategy.successCount + strategy.failureCount;
      if (total === 0) continue;

      const successRate = strategy.successCount / total;
      const recencyBonus = Math.max(0, 1 - (Date.now() - strategy.lastUsed) / (24 * 60 * 60 * 1000)); // Decay over 24h
      const score = successRate * 0.7 + recencyBonus * 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }

    return bestStrategy?.name || (this.useBrightDataDefault ? "proxy" : "direct");
  }

  /**
   * Create axios config with or without proxy
   */
  private createRequestConfig(
    url: string,
    useProxy: boolean,
    cookie?: string,
    referer?: string,
  ): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      url,
      headers: this.getEnhancedHeaders(referer),
      timeout: 25000,
      maxRedirects: 0,
      validateStatus: () => true,
    };

    if (cookie) {
      config.headers!.Cookie = cookie;
    }

    if (useProxy && this.brightDataUrl) {
      config.httpsAgent = new HttpsProxyAgent(this.brightDataUrl);
      config.proxy = false; // Disable axios default proxy handling
    }

    return config;
  }

  /**
   * Advanced request with intelligent fallback and retry
   */
  async makeRequest(
    url: string,
    options: EnhancedRequestConfig = {},
  ): Promise<{ data: any; strategy: string; responseTime: number }> {
    const { useBrightData, maxRetries = 3, retryStrategies = true, ...axiosOptions } = options;

    // Determine strategies to try
    const strategies: Array<{ name: string; useProxy: boolean }> = [];

    if (retryStrategies) {
      const bestStrategy = this.getBestStrategy();

      if (bestStrategy === "proxy") {
        strategies.push({ name: "proxy", useProxy: true });
        strategies.push({ name: "direct", useProxy: false });
      } else {
        strategies.push({ name: "direct", useProxy: false });
        if (this.brightDataUrl) {
          strategies.push({ name: "proxy", useProxy: true });
        }
      }
    } else {
      const useProxy = useBrightData ?? this.useBrightDataDefault;
      strategies.push({ name: useProxy ? "proxy" : "direct", useProxy });
    }

    let lastError: Error | null = null;
    let attemptCount = 0;

    for (const strategy of strategies) {
      const startTime = Date.now();

      try {
        console.log(`🔄 Attempting request with strategy: ${strategy.name}`);

        const config = this.createRequestConfig(
          url,
          strategy.useProxy,
          axiosOptions.headers?.Cookie as string | undefined,
          url,
        );

        // Merge any additional axios options
        Object.assign(config, axiosOptions);

        const response = await axios(config);
        const responseTime = Date.now() - startTime;

        // Check if response is valid (not blocked/empty)
        const isValid = this.validateResponse(response.data, response.status);

        if (isValid) {
          this.updateStrategy(strategy.name, true, responseTime);
          console.log(`✅ Request succeeded with ${strategy.name} strategy (${responseTime}ms)`);

          return {
            data: response.data,
            strategy: strategy.name,
            responseTime,
          };
        } else {
          console.log(`⚠️  Response invalid with ${strategy.name} strategy - trying next`);
          this.updateStrategy(strategy.name, false, responseTime);
        }
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        this.updateStrategy(strategy.name, false, responseTime);
        console.log(`❌ Strategy ${strategy.name} failed:`, error.message);
        if (error.code) {
          console.log(`   Error code: ${error.code}`);
        }
        if (strategy.name === "proxy" && error.message.includes("Proxy")) {
          console.log(`   ⚠️  Proxy connection issue - check if Bright Data zone is configured for HTTP proxy (not browser automation)`);
        }
        lastError = error;
      }

      attemptCount++;

      // Add delay between retries to avoid rate limiting
      if (attemptCount < strategies.length) {
        const delay = 1000 + Math.random() * 2000; // 1-3 seconds
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All strategies failed
    throw lastError || new Error("All request strategies failed");
  }

  /**
   * Validate if response contains actual content (not blocked/empty)
   */
  private validateResponse(data: any, status: number): boolean {
    if (status !== 200) {
      return false;
    }

    if (typeof data !== "string") {
      return true; // JSON responses are usually valid
    }

    // Check for common blocking indicators
    if (
      data.toLowerCase().includes("please verify") ||
      data.toLowerCase().includes("captcha") ||
      data.length < 1000 // Suspiciously short HTML
    ) {
      return false;
    }

    // Check if HTML contains meaningful script tags
    if (data.includes("<html") && !data.includes("<script")) {
      return false; // HTML without any scripts is suspicious
    }

    return true;
  }

  /**
   * Get strategy statistics for monitoring
   */
  getStatistics(): Record<string, RequestStrategy> {
    const stats: Record<string, RequestStrategy> = {};
    for (const [name, strategy] of Array.from(this.strategies.entries())) {
      stats[name] = { ...strategy };
    }
    return stats;
  }

  /**
   * Check if Bright Data is available
   */
  isBrightDataAvailable(): boolean {
    return !!this.brightDataUrl;
  }
}

// Singleton instance
export const proxyManager = new ProxyManager();

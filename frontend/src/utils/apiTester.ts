// API Integration Test Script
// This script validates that all API endpoints are working correctly

import { getApiBaseUrl } from "@/config/env";

const API_BASE_URL = getApiBaseUrl();

interface TestResult {
  endpoint: string;
  method: string;
  status: "PASS" | "FAIL";
  response: any;
  error?: string;
}

class APITester {
  private results: TestResult[] = [];

  async testEndpoint(
    endpoint: string,
    method: string = "GET",
    data?: any
  ): Promise<TestResult> {
    try {
      const config: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (data && method !== "GET") {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const responseData = await response.json();

      const result: TestResult = {
        endpoint,
        method,
        status: response.ok ? "PASS" : "FAIL",
        response: responseData,
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        endpoint,
        method,
        status: "FAIL",
        response: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      this.results.push(result);
      return result;
    }
  }

  async runAllTests(): Promise<void> {
    console.log("🚀 Starting API Integration Tests...\n");

    // Test Health Check
    await this.testEndpoint("/health", "GET");

    // Test Authentication Endpoints
    console.log("🔐 Testing Authentication Endpoints...");
    await this.testEndpoint("/auth/register", "POST", {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    await this.testEndpoint("/auth/login", "POST", {
      identifier: "test@example.com",
      password: "password123",
    });

    // Test User Endpoints
    console.log("👤 Testing User Endpoints...");
    await this.testEndpoint("/users/search", "GET");
    await this.testEndpoint("/users/suggestions", "GET");

    // Test Posts Endpoints
    console.log("📝 Testing Posts Endpoints...");
    await this.testEndpoint("/posts/feed", "GET");
    await this.testEndpoint("/posts", "POST", {
      content: "Test post for API integration",
      visibility: "public",
    });

    // Test Matches/Arcade Endpoints
    console.log("💕 Testing Arcade/Matching Endpoints...");
    await this.testEndpoint("/arcade/cards", "GET");
    await this.testEndpoint("/matches", "GET");

    // Test Chat Endpoints
    console.log("💬 Testing Chat Endpoints...");
    await this.testEndpoint("/chats", "GET");

    // Test Subscriptions Endpoints
    console.log("💎 Testing Subscription Endpoints...");
    await this.testEndpoint("/subscriptions", "GET");
    await this.testEndpoint("/streamers", "GET");

    // Test Reports Endpoints
    console.log("🚨 Testing Reports Endpoints...");
    await this.testEndpoint("/reports", "GET");

    // Test Admin Endpoints
    console.log("👑 Testing Admin Endpoints...");
    await this.testEndpoint("/admin/users", "GET");
    await this.testEndpoint("/admin/reports", "GET");

    // Test Notifications
    console.log("🔔 Testing Notification Endpoints...");
    await this.testEndpoint("/notifications", "GET");

    this.generateReport();
  }

  generateReport(): void {
    console.log("\n📊 API Integration Test Report");
    console.log("================================\n");

    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    console.log("Detailed Results:");
    console.log("─────────────────\n");

    this.results.forEach((result, index) => {
      const status = result.status === "PASS" ? "✅" : "❌";
      console.log(
        `${index + 1}. ${status} ${result.method} ${result.endpoint}`
      );

      if (result.status === "FAIL" && result.error) {
        console.log(`   Error: ${result.error}`);
      }

      if (result.status === "PASS" && result.response) {
        const responsePreview =
          typeof result.response === "object"
            ? Object.keys(result.response).join(", ")
            : result.response.toString().substring(0, 50);
        console.log(
          `   Response: ${responsePreview}${
            responsePreview.length > 50 ? "..." : ""
          }`
        );
      }
      console.log("");
    });

    console.log("Integration Status:");
    console.log("─────────────────");
    if (passed === total) {
      console.log("🎉 ALL TESTS PASSED - Backend integration is complete!");
    } else if (passed > total * 0.8) {
      console.log(
        "⚠️  Most tests passed - Some endpoints may need authentication tokens"
      );
    } else {
      console.log("🚨 Multiple test failures - Check backend server status");
    }
  }
}

// Export for use in testing
export default APITester;

// Auto-run if called directly (for Node.js environment)
if (typeof window === "undefined") {
  const tester = new APITester();
  tester.runAllTests();
}

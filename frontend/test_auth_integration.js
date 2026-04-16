// Test script to verify authentication and profile integration
const BASE_URL = "http://localhost:3000/api";

async function testAuthIntegration() {
  console.log("=== Testing Authentication Integration ===\n");

  // Test 1: Register a new user
  console.log("1. Testing user registration...");
  const testUser = {
    username: "testuser" + Date.now(),
    email: "test" + Date.now() + "@example.com",
    password: "Password123!",
    fullName: "Test User",
  };

  try {
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    console.log("Registration response:", registerData);

    if (registerResponse.ok && registerData.token) {
      console.log("✅ Registration successful!");
      const token = registerData.token;

      // Test 2: Get user profile
      console.log("\n2. Testing profile endpoint...");
      const profileResponse = await fetch(`${BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profileData = await profileResponse.json();
      console.log("Profile response:", profileData);

      if (profileResponse.ok) {
        console.log("✅ Profile endpoint working!");

        // Verify data structure
        if (
          profileData.id &&
          profileData.fullName &&
          profileData.email &&
          profileData.username
        ) {
          console.log("✅ Profile data structure correct!");
          console.log("User ID:", profileData.id);
          console.log("Full Name:", profileData.fullName);
          console.log("Email:", profileData.email);
          console.log("Username:", profileData.username);
        } else {
          console.log("❌ Profile data structure incorrect");
          console.log("Missing fields:", {
            id: !profileData.id,
            fullName: !profileData.fullName,
            email: !profileData.email,
            username: !profileData.username,
          });
        }
      } else {
        console.log("❌ Profile endpoint failed:", profileData);
      }

      // Test 3: Login with email
      console.log("\n3. Testing login with email...");
      const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: testUser.email,
          password: testUser.password,
        }),
      });

      const loginData = await loginResponse.json();
      console.log("Login response:", loginData);

      if (loginResponse.ok && loginData.token) {
        console.log("✅ Login with email successful!");
      } else {
        console.log("❌ Login with email failed:", loginData);
      }

      // Test 4: Login with username
      console.log("\n4. Testing login with username...");
      const loginUsernameResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: testUser.username,
          password: testUser.password,
        }),
      });

      const loginUsernameData = await loginUsernameResponse.json();
      console.log("Login username response:", loginUsernameData);

      if (loginUsernameResponse.ok && loginUsernameData.token) {
        console.log("✅ Login with username successful!");
      } else {
        console.log("❌ Login with username failed:", loginUsernameData);
      }
    } else {
      console.log("❌ Registration failed:", registerData);
    }
  } catch (error) {
    console.log("❌ Error during testing:", error.message);
  }

  console.log("\n=== Test Complete ===");
}

testAuthIntegration();

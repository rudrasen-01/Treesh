import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const VIDEOSDK_API_KEY = process.env.VIDEOSDK_API_KEY;
const VIDEOSDK_SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;
const VIDEOSDK_API_ENDPOINT = "https://api.videosdk.live/v2";

// Validate VideoSDK credentials on module load
if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET_KEY) {
  console.warn("⚠️  VideoSDK credentials missing! Please set VIDEOSDK_API_KEY and VIDEOSDK_SECRET_KEY in .env file");
} else {
  console.log("✅ VideoSDK credentials loaded");
  console.log("📝 API Key:", VIDEOSDK_API_KEY.substring(0, 10) + "...");
}

/**
 * Generate JWT token for VideoSDK authentication
 * @param {Object} options - Token options (roomId, participantId, etc.)
 * @returns {string} JWT token
 */
export const generateVideoSDKToken = (options = {}) => {
  if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET_KEY) {
    throw new Error("VideoSDK credentials are missing. Please set VIDEOSDK_API_KEY and VIDEOSDK_SECRET_KEY in .env file");
  }

  // VideoSDK token payload format
  // For React SDK (infra API), don't use version: 2
  // For V2 API (backend), use version: 2 with 'crawler' role
  const payload = {
    apikey: VIDEOSDK_API_KEY,
    permissions: options.permissions || ["allow_join", "allow_mod"],
    // Only add version if explicitly requested (for V2 API backend calls)
    ...(options.useV2API && { version: 2 }),
    roles: options.roles || (options.useV2API ? ["crawler"] : ["rtc"]), // V2 API needs 'crawler', React SDK needs 'rtc'
  };

  // Add optional fields if provided
  if (options.roomId) {
    payload.roomId = options.roomId;
  }
  if (options.participantId) {
    payload.participantId = options.participantId;
  }

  try {
    const token = jwt.sign(payload, VIDEOSDK_SECRET_KEY, {
      algorithm: "HS256",
      expiresIn: options.expiresIn || "120m", // 2 hours as per VideoSDK recommendation
    });
    return token;
  } catch (error) {
    console.error("Error generating VideoSDK token:", error);
    throw new Error("Failed to generate VideoSDK token: " + error.message);
  }
};

/**
 * Create a new meeting/room
 * @param {Object} options - Meeting options
 * @returns {Promise<Object>} Meeting details
 */
export const createMeeting = async (options = {}) => {
  try {
    // Check credentials first
    if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET_KEY) {
      console.error("❌ VideoSDK credentials missing!");
      return {
        success: false,
        error: "VideoSDK credentials are missing. Please set VIDEOSDK_API_KEY and VIDEOSDK_SECRET_KEY in .env file",
      };
    }

    const token = generateVideoSDKToken({
      permissions: ['allow_join', 'allow_mod'],
      useV2API: true, // This is for V2 API backend call
      roles: ['crawler'], // V2 API only accepts 'crawler' role
    });
    
    console.log("🔑 Generated VideoSDK token for meeting creation");
    
    const response = await fetch(`${VIDEOSDK_API_ENDPOINT}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        region: options.region || "sg001",
        autoCloseConfig: options.autoCloseConfig || {
          type: "session-end-and-deactivate",
          duration: 1,
        },
        webhook: options.webhook || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ VideoSDK API Error:", response.status, errorText);
      let errorMessage = `Failed to create meeting: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If not JSON, use the text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("✅ VideoSDK room created:", data.roomId);
    return {
      success: true,
      roomId: data.roomId,
      data: data,
    };
  } catch (error) {
    console.error("❌ Error creating VideoSDK meeting:", error);
    return {
      success: false,
      error: error.message || "Failed to create VideoSDK meeting room",
    };
  }
};

/**
 * Validate a meeting/room
 * @param {string} roomId - Room ID to validate
 * @returns {Promise<Object>} Validation result
 */
export const validateMeeting = async (roomId) => {
  try {
    const token = generateVideoSDKToken();
    
    const response = await fetch(
      `${VIDEOSDK_API_ENDPOINT}/rooms/validate/${roomId}`,
      {
        method: "GET",
        headers: {
          Authorization: token,
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: "Invalid room ID",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error validating meeting:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * End a meeting/room
 * @param {string} roomId - Room ID to end
 * @returns {Promise<Object>} Result
 */
export const endMeeting = async (roomId) => {
  try {
    if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET_KEY) {
      return {
        success: false,
        error: "VideoSDK credentials are missing",
      };
    }

    // Use V2 API token format for backend API calls
    const token = generateVideoSDKToken({
      permissions: ['allow_join', 'allow_mod'],
      useV2API: true, // This is for V2 API backend call
      roles: ['crawler'], // V2 API only accepts 'crawler' role
    });
    
    console.log(`🔄 Ending VideoSDK meeting: ${roomId}`);
    
    const response = await fetch(
      `${VIDEOSDK_API_ENDPOINT}/rooms/${roomId}/deactivate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ VideoSDK API Error (end meeting): ${response.status}`, errorText);
      
      // If room not found (404), it might already be ended - that's okay
      if (response.status === 404) {
        console.log('⚠️ Room not found (might already be ended)');
        return {
          success: true,
          message: "Meeting already ended or not found",
        };
      }
      
      throw new Error(`Failed to end meeting: ${response.statusText}`);
    }

    const data = await response.json().catch(() => ({}));
    console.log('✅ VideoSDK meeting ended successfully');
    
    return {
      success: true,
      message: "Meeting ended successfully",
      data: data,
    };
  } catch (error) {
    console.error("❌ Error ending meeting:", error);
    return {
      success: false,
      error: error.message || "Failed to end meeting",
    };
  }
};

/**
 * Get meeting details
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Meeting details
 */
export const getMeetingDetails = async (roomId) => {
  try {
    const token = generateVideoSDKToken();
    
    const response = await fetch(`${VIDEOSDK_API_ENDPOINT}/rooms/${roomId}`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get meeting details: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error getting meeting details:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Start recording
 * @param {string} roomId - Room ID
 * @param {Object} options - Recording options
 * @returns {Promise<Object>} Recording result
 */
export const startRecording = async (roomId, options = {}) => {
  try {
    const token = generateVideoSDKToken();
    
    const response = await fetch(
      `${VIDEOSDK_API_ENDPOINT}/recordings/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          roomId: roomId,
          ...options,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start recording: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error starting recording:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Stop recording
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Result
 */
export const stopRecording = async (roomId) => {
  try {
    const token = generateVideoSDKToken();
    
    const response = await fetch(`${VIDEOSDK_API_ENDPOINT}/recordings/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        roomId: roomId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to stop recording: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error stopping recording:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Start livestream
 * @param {string} roomId - Room ID
 * @param {Object} outputs - Livestream outputs (YouTube, Facebook, etc.)
 * @returns {Promise<Object>} Livestream result
 */
export const startLivestream = async (roomId, outputs = []) => {
  try {
    const token = generateVideoSDKToken();
    
    const response = await fetch(
      `${VIDEOSDK_API_ENDPOINT}/livestreams/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          roomId: roomId,
          outputs: outputs,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start livestream: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error starting livestream:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Stop livestream
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Result
 */
export const stopLivestream = async (roomId) => {
  try {
    const token = generateVideoSDKToken();
    
    const response = await fetch(`${VIDEOSDK_API_ENDPOINT}/livestreams/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        roomId: roomId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to stop livestream: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error stopping livestream:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  generateVideoSDKToken,
  createMeeting,
  validateMeeting,
  endMeeting,
  getMeetingDetails,
  startRecording,
  stopRecording,
  startLivestream,
  stopLivestream,
};

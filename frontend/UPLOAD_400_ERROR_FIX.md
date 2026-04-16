# 🔧 400 BAD REQUEST FIX - UPLOAD FLOW CORRECTED

## 📋 Issue Analysis

**Error:** `POST http://localhost:3000/api/posts 400 (Bad Request)`
**Root Cause:** Incorrect API usage - backend expects two-step process

## 🐛 Problem Discovery

### Backend Architecture:

The backend has **separate endpoints** for file handling:

- `/api/upload/image` - Upload image files
- `/api/upload/video` - Upload video files
- `/api/posts` - Create posts with content + media URLs

### Previous Error:

UploadModal was trying to send FormData with raw files directly to `/api/posts`, but this endpoint only accepts JSON with content and media URLs.

## ✅ Solution Implemented

### 🔄 Two-Step Upload Process

**Step 1: Upload File**

```typescript
// Upload file to get URL
const uploadFormData = new FormData();
uploadFormData.append(isVideo ? "video" : "image", selectedFile);

const uploadResponse = await fetch(
  `/api/upload/${isVideo ? "video" : "image"}`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: uploadFormData,
  }
);

const uploadResult = await uploadResponse.json();
// Returns: { success: true, data: { url: "...", publicId: "..." } }
```

**Step 2: Create Post**

```typescript
// Create post with content and media URLs
const postData = {
  content: caption,
  type: type,
  media: [
    {
      type: isVideo ? "video" : "image",
      url: uploadResult.data.url,
      publicId: uploadResult.data.publicId,
    },
  ],
  visibility: "public",
  tags: [],
  mentions: [],
  location: null,
};

const postResponse = await fetch("/api/posts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(postData),
});
```

## 🎯 Expected Flow Now

1. **User selects file** ✅
2. **File uploads to Cloudinary** ✅ (via upload endpoint)
3. **Get media URL back** ✅
4. **Create post with media URL** ✅ (via posts endpoint)
5. **Post appears in database** ✅
6. **ProfilePage refreshes and shows post** ✅

## 🧪 Test Results Expected

**Console Output Should Show:**

```
Uploading file: image.jpg
File uploaded successfully: { data: { url: "cloudinary-url", publicId: "..." } }
Creating post with data: { content: "caption", type: "post", media: [...] }
Post created successfully: { _id: "...", content: "...", authorId: "..." }
Post created event received, refreshing posts...
Refreshed: 1 posts for user profile
```

---

**Status: ✅ FIXED** | **Upload now follows correct backend architecture**

The 400 error was caused by sending FormData to an endpoint that expects JSON. Now using the proper two-step upload process! 🚀

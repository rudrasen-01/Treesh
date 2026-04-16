# 🧪 Testing Your Live Streaming Feature

## Quick Test Guide

### Prerequisites ✅
- VideoSDK credentials configured in `.env`
- Backend server running on port 3000
- Frontend running on port 8080
- Camera and microphone permissions enabled in browser

---

## Test 1: Start a Stream (Streamer)

1. **Navigate to Live Streams page**
   - Click "Live" in the sidebar navigation

2. **Click "Go Live" button** (red button in top right)

3. **Fill in stream details:**
   ```
   Title: "Test Stream"
   Description: "Testing my live streaming feature"
   Category: Gaming
   ```

4. **Grant permissions:**
   - Allow camera access when prompted
   - Allow microphone access when prompted

5. **Click "Go Live"**
   - You should see your camera preview
   - Stream controls should appear at the bottom

6. **Test stream controls:**
   - Click 🎤 to mute/unmute microphone
   - Click 📹 to turn camera on/off
   - Click ⏺️ to start recording
   - Type a chat message

7. **End the stream:**
   - Click "End Stream" button
   - Confirm your stream has ended

**Expected Result:** ✅ Stream starts successfully, you see yourself on camera, controls work

---

## Test 2: Join a Stream (Viewer)

1. **Open a new browser window/incognito** (to simulate another user)

2. **Login with a different account**

3. **Navigate to Live Streams page**

4. **You should see your test stream** in the live streams grid
   - Look for the "LIVE" badge (red, pulsing)
   - Should show viewer count

5. **Click on the stream card**

6. **Watch the stream:**
   - Video should play
   - Chat should be visible
   - Send a test message

7. **Leave the stream:**
   - Go back to streams list

**Expected Result:** ✅ You can see and watch the live stream, chat works

---

## Test 3: API Endpoints

### Test Token Generation
```bash
curl -X GET http://localhost:3000/api/streams/token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGc..."
}
```

### Test Start Stream
```bash
curl -X POST http://localhost:3000/api/streams/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Stream",
    "description": "Testing via API",
    "category": "gaming"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "stream": { ... },
  "roomId": "...",
  "token": "..."
}
```

### Test Get Live Streams
```bash
curl -X GET http://localhost:3000/api/streams/live \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
[
  {
    "_id": "...",
    "title": "Test Stream",
    "status": "live",
    "streamerId": { ... },
    "currentViewers": 1
  }
]
```

---

## Test 4: Recording Feature

1. **Start a stream** (as per Test 1)

2. **Click the recording button** ⏺️
   - Should turn red
   - Toast notification: "Recording Started"

3. **Record for 30 seconds**

4. **Click recording button again** to stop
   - Button returns to normal
   - Toast notification: "Recording Stopped"

5. **End the stream**

**Expected Result:** ✅ Recording starts and stops successfully

---

## Test 5: Multiple Viewers

1. **Start a stream** (as per Test 1)

2. **Open 3 different browser windows** (or use different devices)

3. **Login with different accounts** in each window

4. **Join the stream** from all 3 accounts

5. **Check viewer count** on streamer's screen
   - Should show "3" viewers

6. **Have each viewer leave** one by one
   - Viewer count should decrease

**Expected Result:** ✅ Viewer count updates correctly

---

## Test 6: Stream Categories

1. **Create streams in different categories:**
   - Gaming stream
   - Music stream
   - Lifestyle stream

2. **Go to Live Streams page**

3. **Use category tabs** to filter
   - Click "Gaming" → should show only gaming streams
   - Click "Music" → should show only music streams
   - Click "All" → should show all streams

**Expected Result:** ✅ Category filtering works correctly

---

## Troubleshooting

### Issue: "Failed to access camera/microphone"
**Solution:**
- Check browser permissions (chrome://settings/content/camera)
- Make sure no other app is using the camera
- Try refreshing the page
- On Mac: System Preferences → Security & Privacy → Camera/Microphone

### Issue: "Failed to start stream"
**Solution:**
- Check backend logs for errors
- Verify VideoSDK credentials in `.env`
- Make sure MongoDB is connected
- Check internet connection

### Issue: "Stream not appearing in list"
**Solution:**
- Refresh the page
- Check stream status in database
- Verify stream was created successfully
- Check backend API response

### Issue: "No video showing"
**Solution:**
- Check if camera is enabled (not blocked)
- Look for JavaScript errors in browser console
- Verify VideoSDK room was created
- Check network tab for failed requests

### Issue: "Can't hear audio"
**Solution:**
- Check if microphone is enabled
- Verify browser audio permissions
- Check system audio settings
- Unmute if muted

---

## Debug Mode

### Enable Verbose Logging

**Backend:**
Add this to your stream routes:
```javascript
console.log('Stream Data:', stream);
console.log('VideoSDK Room ID:', roomId);
console.log('Token:', token);
```

**Frontend:**
Open browser console (F12) and check for:
- VideoSDK connection logs
- API request/response logs
- MediaStream logs

---

## Performance Testing

### Test with Multiple Streams

1. Create 5 concurrent streams
2. Have 10 viewers join each stream
3. Monitor:
   - Server CPU usage
   - Memory usage
   - Network bandwidth
   - Stream quality

**Expected:**
- Streams should remain stable
- No significant lag
- CPU < 80%
- Memory < 2GB

---

## Success Criteria

✅ **All tests pass if:**
- [ ] Can start a stream with camera/mic
- [ ] Stream appears in live streams list
- [ ] Viewers can join and watch
- [ ] Chat messages send/receive
- [ ] Recording starts and stops
- [ ] Viewer count updates correctly
- [ ] Stream ends properly
- [ ] No errors in console
- [ ] Video quality is good
- [ ] Audio is clear

---

## Getting Help

If you encounter issues:

1. **Check backend logs:**
   ```bash
   cd trees\ backend
   npm run dev
   ```

2. **Check browser console** (F12)

3. **Verify VideoSDK credentials** are correct

4. **Test VideoSDK API directly:**
   ```bash
   curl -X POST https://api.videosdk.live/v2/rooms \
     -H "Authorization: YOUR_VIDEOSDK_TOKEN"
   ```

5. **Check MongoDB connection**

---

## 🎉 All Tests Passed?

Congratulations! Your live streaming feature is working perfectly!

You can now:
- Go live anytime
- Stream to multiple viewers
- Record your streams
- Chat with your audience
- Build your streaming community

**Start streaming now!** 🚀📹

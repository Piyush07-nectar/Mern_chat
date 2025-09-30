# Cloudinary Setup Guide

## 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your Cloudinary Credentials
1. After logging in, go to your Dashboard
2. Copy the following values:
   - Cloud Name
   - API Key
   - API Secret

## 3. Add Environment Variables
Add these variables to your `.env` file in the backend directory:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 4. Install Dependencies
Run the following command in your backend directory:

```bash
npm install cloudinary multer
```

## 5. Features Added
- Image upload to Cloudinary
- Image messages in chat
- Automatic image optimization
- Image deletion functionality
- Real-time image sharing

## 6. API Endpoints
- `POST /api/image/upload` - Upload image to chat
- `DELETE /api/image/delete/:messageId` - Delete image message

## 7. Frontend Integration
The frontend will need to be updated to:
- Add image upload button
- Display images in chat
- Handle image message types

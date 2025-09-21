require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const User = require('../src/models/User');
const Post = require('../src/models/Post');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Generate user details via Grok 4 Fast
const generateUserDetails = async () => {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "x-ai/grok-4-fast:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Generate a realistic username for a social media user. Return as JSON like {\"username\":\"...\"}" }
            ]
          }
        ]
      })
    });

    const data = await res.json();
    console.log("🚀 Grok response:", JSON.stringify(data, null, 2));

    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("No text returned from Grok");

    const parsed = JSON.parse(text); // parse the JSON string returned
    return { username: parsed.username };
  } catch (error) {
    console.error('❌ Grok user generation failed, using fallback.', error.message);
    const fallbackUsername = `User${Math.floor(Math.random() * 10000)}`;
    return { username: fallbackUsername };
  }
};


// Create user
const createUser = async () => {
  try {
    // Generate realistic username using Grok
    const { username } = await generateUserDetails();
    
    // Force email to use @example.com
    const email = `${username.toLowerCase()}@example.com`;
    const password = process.env.DEFAULT_PASSWORD;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    console.log(`✅ Created user: ${username} (${email})`);
    return user;
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    return null;
  }
};


// Generate image using Picsum
const generateImage = async () => {
  // Pick a random Picsum ID between 1 and 1084 (Picsum currently has ~1084 images)
  const imageId = Math.floor(Math.random() * 1084) + 1;
  // Use the /id/{id}/{width}/{height} endpoint for a consistent image
  return `https://picsum.photos/id/${imageId}/800/600`;
};

// Generate caption using Grok 4 Fast
const generateCaption = async (imageUrl) => {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "x-ai/grok-4-fast:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Generate a short, creative social media caption for this image." },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ]
      })
    });

    const data = await res.json();
    // Access content as string directly
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("No caption returned from Grok");

    return text.trim();
  } catch (error) {
    console.error('❌ Grok caption generation failed, using fallback.', error.message);
    return "A beautiful moment! ✨";
  }
};

// Upload image to Cloudinary
const uploadToCloudinary = async (imageUrl) => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'vistagram-posts',
      transformation: [{ width: 800, height: 600, crop: 'fill' }]
    });
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading to Cloudinary:', error.message);
    return imageUrl; // fallback to original URL
  }
};

// Generate random date within last year
const generateRandomDate = () => {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()));
};

// Create post
const createPost = async (users) => {
  try {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const imageUrl = await generateImage();
    const caption = await generateCaption(imageUrl);
    const cloudinaryUrl = await uploadToCloudinary(imageUrl);

    const post = new Post({
      user: randomUser._id,
      imageUrl: cloudinaryUrl,
      caption,
      likes: [],
      shareCount: Math.floor(Math.random() * 50),
      createdAt: generateRandomDate()
    });

    await post.save();
    console.log(`✅ Created post by ${randomUser.username}: "${caption}"`);
    return post;
  } catch (error) {
    console.error('❌ Error creating post:', error.message);
    return null;
  }
};

// Main function
const populateDatabase = async () => {
  try {
    const MIN_USERS = parseInt(process.env.MIN_USERS, 10) || 5;
    const MIN_POSTS = parseInt(process.env.MIN_POSTS, 10) || 10;
    // Check if already connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    
    console.log('🚀 Starting database population...\n');

    // Users
    const userCount = await User.countDocuments();
    console.log(`👥 Current users: ${userCount}`);
    
    if (userCount < MIN_USERS) {
      console.log('📝 Creating users...');
      for (let i = 0; i < MIN_USERS - userCount; i++) {
        await createUser();
      }
    }
    
    const allUsers = await User.find();

    // Posts
    const postCount = await Post.countDocuments();
    console.log(`📸 Current posts: ${postCount}`);
    
    if (postCount < MIN_POSTS) {
      console.log('📝 Creating posts...');
      for (let i = 0; i < MIN_POSTS - postCount; i++) {
        await createPost(allUsers);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n🎉 Database population completed!');
    
    // Final counts
    const finalUserCount = await User.countDocuments();
    const finalPostCount = await Post.countDocuments();
    console.log(`📊 Final counts: Users: ${finalUserCount}, Posts: ${finalPostCount}`);
    
  } catch (error) {
    console.error('❌ Error in populateDatabase:', error);
    throw error; // Re-throw for API error handling
  }
};

// Only run directly if called as main module
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log('\n🔌 Closing database connection');
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      mongoose.connection.close();
      process.exit(1);
    });
}

module.exports = { populateDatabase };

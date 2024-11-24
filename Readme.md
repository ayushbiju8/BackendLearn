# Backend Setup with Express and MongoDB

This document outlines the steps to set up a backend application using Express and MongoDB, including custom error handling, response classes, and middleware for common tasks like CORS, JSON parsing, and database connection.

## Step 1: Initialize Node App
- **Command:** `npm init -y`
- **Purpose:** Initializes a new Node.js application, creating the `package.json` file for managing dependencies.

---

## Step 2: Install Dependencies and Configure Nodemon
- **Dependencies Installed:**
  - `nodemon`
- **Purpose:**  
  - Automatically restarts the server during development on file changes.
  - Configuration added to `package.json` for running the app with `npm run dev`.

---

## Step 3: Create Folder Structure
- **Folders Created in `src`:**
  - `controllers`, `db`, `middlewares`, `models`, `routes`, `utils`
- **Other Files Created:**
  - `.env`, `.prettier` for environment variables and code formatting.

---

## Step 4: Set Up Database Connection
- **File Created:** `src/db/index.js`
- **Code:**  
  - Connects to MongoDB using Mongoose.
  - Logs connection success or failure.
  - Gracefully handles errors and exits the process on failure.

```javascript
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`DB Connected : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

export default connectDB;

```
## Step 6: Create Custom API Error Class
- **File Created:** `src/utils/ApiError.js`
- **Code:**
  Custom error class `ApiError` to handle application-specific errors with useful details.

```javascript
class ApiError extends Error {
    constructor(statusCode, message = "Message", errors = [], stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;

```

## Step 7: Create Custom API Response Class
- **File Created:** `src/utils/ApiResponse.js`
- **Code:**  
  Custom class `ApiResponse` to standardize API responses with status code, data, message, and success flag.

```javascript
class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}
```

## Step 8: Create Async Error Handling Middleware
- **File Created:** `src/middlewares/asyncHandler.js`
- **Code:**  
  Middleware `asyncHandler` to wrap asynchronous route handlers, automatically handling errors and passing them to the next error handler.

```javascript
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export default asyncHandler;
```

## Step 8: Create User Model with JWT Authentication

### File Created: `src/models/User.js`

In this step, we will create the **User model** that handles user-related data and manages authentication through **JWT (JSON Web Tokens)**. The model includes fields like username, email, password, full name, avatar, and watch history, and it also provides methods for password hashing and generating access/refresh tokens.

### Code:

```javascript
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the user schema
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            index: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, // cloudinary URL
            required: true,
        },
        coverImage: {
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video", // Reference to Video model
            },
        ],
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

// Pre-save hook to hash the password before saving it
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    }
});

// Instance method to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Instance method to generate an access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

// Instance method to generate a refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

// Export the User model
export const User = mongoose.model("User", userSchema);
```
## Step 9: Create Video Model with Pagination

### File Created: `src/models/Video.js`

In this step, we define the **Video model** that handles the storage and management of video-related data. This includes fields such as the video file URL, thumbnail, title, description, duration, views, and publication status. We also implement pagination functionality using the **mongoose-aggregate-paginate-v2** plugin to efficiently handle large datasets of videos.

### Code:

```javascript
import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Define the video schema
const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // Reference to User model
        },
    },
    { timestamps: true }
);

// Apply the aggregate paginate plugin for pagination functionality
videoSchema.plugin(mongooseAggregatePaginate);

// Export the Video model
export const Video = mongoose.model("Video", videoSchema);
```
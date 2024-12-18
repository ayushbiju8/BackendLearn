import AsyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"

const registerUser = AsyncHandler( async (req,res)=>{
    
    // Get user Details From Front End
    // Validation
    // Check if User Already Exist (email,username)
    // Check For images, Check for Avatar
    // Upload To Cloudinary , avatar
    // Create User Object - create entry in DB
    // Remove password and Refresh Token Field From Response
    // Check for User Creation
    // Return Response

    const {username,email,password,fullName } = req.body
    console.log("Username" , username);
    
    // if ( fullname==="") {
    //     throw new ApiError(400,"Full Name is Required")
    // }
    if (
        [fullName,email,username,password].some((field)=>
            field?.trim()===""
        )
    ) {
        throw new ApiError(400,"All Fields are Required")
    }

    const existingUser = await User.findOne({
        $or : [ {username,email} ]
    })

    if (existingUser) {
        throw new ApiError(409,"User Already Exist")
    }

    const avtarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avtarLocalPath) {
        throw new ApiError(400,"Avtar File Required")
    }

    const avatar = await uploadOnCloudinary(avtarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400,"Avtar File Required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"Something Went Wrong in Registering User")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Succesfully")
    )
} )

export {registerUser}
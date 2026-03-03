import mongoose from "mongoose";
import { USER_ROLES, type UserRole } from "../constants/roles";

type User = {
    name : string
    email : string
    address?: string
    password : string
    role: UserRole
    sellerApproved: boolean
    sellerActive: boolean
    resetToken? : string | null
    resetTokenExpiry? : Date | null
}

const userSchema = new mongoose.Schema<User>({
    name : {
        type: String,
        minlength: [2, "Name at least 2 characters"],
        required: [true, "Name is required"],
        trim:true
    },
    email :{
        type:String,
        unique:[true,"User already registered"],
        required:[true,"email is required"],
        index:true,
        trim:true,
        lowercase:true,
        match:[/^\S+@\S+\.\S+$/,"please fill a valid email format"]
    },
    address : {
        type: String,
        trim:true
    },
   
    password : {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.CUSTOMER,
        index: true,
    },
    sellerApproved: {
        type: Boolean,
        default: false,
        index: true,
    },
    sellerActive: {
        type: Boolean,
        default: false,
        index: true,
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    }
},{timestamps:true})

export const UserModel = mongoose.model("User", userSchema)

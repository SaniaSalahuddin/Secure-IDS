import mongoose from "mongoose";

const attackSchema=new mongoose.Schema({
    attackType:String,
    confidence:Number,
    uploadedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    createdAt:{
        type:Date,
        default:Date.now

    }

});

const Attack = mongoose.model("Attack", attackSchema);
export default Attack;
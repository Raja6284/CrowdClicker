import { NextFunction,Request, Response } from "express";
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET ?? ""

export function authMiddleware(req:Request,res:Response,next:NextFunction){

    const authHeader = req.headers["authorization"] ?? ""

    try{
        const decoded = jwt.verify(authHeader,JWT_SECRET)
        //@ts-ignore
        if(decoded.userId){
            //@ts-ignore
            req.userId = decoded.userId
            return next()
        }else{
            res.status(403).json({
                message:"you are not logged in"
            })
        }
    }catch(e){
        return res.json({
            status:403,
            message:"error while verifying jwt"
        })
    }

}
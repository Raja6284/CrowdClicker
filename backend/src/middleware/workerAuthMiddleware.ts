
import { Request,Response,NextFunction } from "express";
import jwt from 'jsonwebtoken'

const JWT_SECRET_WORKER = process.env.JWT_SECRET_WORKER ?? " "

export default function workerAuthMiddleware(req:Request,res:Response,next:NextFunction){

    const authHeader = req.headers["authorization"] ?? "";

    try{
        const decoded = jwt.verify(authHeader,JWT_SECRET_WORKER)
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
            message:"error while verifying jwt of worker"
        })
    }
}
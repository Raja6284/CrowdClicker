
import { Router } from "express";
import jwt from 'jsonwebtoken'
import { PrismaClient } from "@prisma/client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
const router = Router();



const JWT_SECRET = 'dskfjsfkssfkl'

const prismaClient = new PrismaClient()

//signin with wallet
//signing a message
router.post('/signin', async(req,res)=>{

    const hardcodedWallet = '0xDf9CC552C236c43a594B8350E55Ffc50b2b8C515'
    //Authentication logic

    const existingUser = await prismaClient.user.findFirst({
        where:{
            address:hardcodedWallet
        }
    })

    if(existingUser){
        const token = jwt.sign({
            userId : existingUser.id
        },JWT_SECRET)

        return res.json({
            token
        })
    }else{
        const user = await prismaClient.user.create({
            data:{
                address:hardcodedWallet
            }
        })

        const token = jwt.sign({
            userId:user.id
        },JWT_SECRET)

        return res.json({
            token
        })
    }


})


//presignedUrl


export default router
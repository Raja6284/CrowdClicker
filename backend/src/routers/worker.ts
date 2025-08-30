import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from 'jsonwebtoken'
import workerAuthMiddleware from "../middleware/workerAuthMiddleware";
import { getNextTask } from "../db";

const router = Router();


const prismaClient = new PrismaClient()
const JWT_SECRET_WORKER = process.env.JWT_SECRET_WORKER ?? ""


router.post('submission',workerAuthMiddleware,async(req,res)=>{

})


router.get('/nextTask',workerAuthMiddleware, async (req,res)=>{
    //@ts-ignore
    const userId:string = req.userId

    const nextTask = await getNextTask(Number(userId))
    // const nextTask = await prismaClient.task.findMany({
    //     where:{
    //         done:false,
    //        submissions:{
    //         none:{
    //             worker_id:userId,
    //         }
    //        }
    //     },
    //     select:{
    //         options:true,
    //         title:true
    //     }
    // })

    if(!nextTask){
        return res.json({
            status:411,
            message:"no more task for you to review"
        })
    }else{
        return res.json({
            nextTask
        })
    }
})

router.post("/signin", async (req, res) => {

  const hardcodedWallet = "0xDf9CC5gdfgfgfd6c43a594B8350E55Ffc50b2b8C515";
  //Authentication logic

  const existingUser = await prismaClient.worker.findFirst({
    where: {
      address: hardcodedWallet,
    },
  });

  if (existingUser) {
    const token = jwt.sign(
      {
        userId: existingUser.id,
      },
      JWT_SECRET_WORKER
    );

    return res.json({
      token,
    });

  } else {
    const user = await prismaClient.worker.create({
      data: {
        address: hardcodedWallet,
        pending_amount:0,
        locked_amount:0
      }
    });

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET_WORKER
    );

    return res.json({
      token,
    });
  }
});

export default router
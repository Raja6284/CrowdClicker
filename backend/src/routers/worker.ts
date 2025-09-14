import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from 'jsonwebtoken'
import workerAuthMiddleware from "../middleware/workerAuthMiddleware";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";
import { SystemProgram, Transaction,PublicKey, Keypair, Connection, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58"
import nacl from 'tweetnacl'



const router = Router();


const prismaClient = new PrismaClient()
const JWT_SECRET_WORKER = process.env.JWT_SECRET_WORKER ?? ""
const TOTAL_SUBMISSION = 100
const TOTAL_DECIMAL = 1000_000
const connection  = new Connection(process.env.SOLANA_DEVNET_RPC_URL || "")

router.post('/payout',workerAuthMiddleware,async (req,res)=>{

  //@ts-ignore
  const userId = req.userId
  const worker = await prismaClient.worker.findFirst({
    where:{
      id:Number(userId)
    }
  })

  if(!worker){
    return res.json({
      status:403,
      message:"worker not found"
    })
  }

  //const address = worker.address

  //write the logic here to create the transaction 
  //send required amoutn to worker address
  //create new txn or solana.web3.cre..

  //const txnId = "dfsfggsdss"

  //first create an entry in your database and thant send the transaction to blockchian

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey("FdPedWg8PMvDpi5dcwBZ6o5YY2Buxd1ivdvUpZQXft7P"),
      toPubkey:new PublicKey(worker.address),
      lamports: 1000_000_000 * worker.pending_amount / TOTAL_DECIMAL
    })
  )

  console.log(worker.address)

  const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

  const keypair = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY))

  let signature = ""

  try {
        signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair],
        );
    
     } catch(e) {
        return res.json({
            message: "Transaction failed"
        })
     }
    
    console.log(signature)

  await prismaClient.$transaction(async tx =>{
      await tx.worker.update({
        where:{
          id:Number(userId)
        },
        data:{
          pending_amount:{
            decrement:worker.pending_amount
          },
          locked_amount:{
            increment:worker.locked_amount
          }
        }
      })


      await tx.payouts.create({
        data:{
            user_id:userId,
            amount:worker.pending_amount,
            status:"Processing",
            signature:signature
        }
      })
  })


})

router.get('/balance',workerAuthMiddleware,async (req,res)=>{

  //@ts-ignore
  const userId = req.userId

  const worker = await prismaClient.worker.findFirst({
    where:{
      id:userId
    }
  })

  return res.json({
    pendingAmount : worker?.pending_amount,
    lockedAmount: worker?.locked_amount
  })

})


router.post('/submission',workerAuthMiddleware,async(req,res)=>{
    //@ts-ignore
    const userId = req.userId
    const body = req.body

    const paresedBody =  createSubmissionInput.safeParse(body)

    if(paresedBody.success){

      const task = await getNextTask(Number(userId))
      //console.log(task)

      if(!task || task?.id !== Number(paresedBody.data.taskId)){
        return res.status(411).json({
          message:"incorrect task id"
        })
      }

      const amount = (task.amount/TOTAL_SUBMISSION)

      const submission = await prismaClient.$transaction(async tx =>{

         const submission = await tx.submission.create({
        data:{
          option_id:Number(paresedBody.data.selection),
          worker_id:userId,
          task_id:Number(paresedBody.data.taskId),
          amount : amount * TOTAL_DECIMAL,
        }
      })

        await tx.worker.update({
          where:{
            id:userId
          },
          data:{
            pending_amount:{
              increment:amount 
            }
          }
        })

        return submission
      })
     

      const nextTask = await getNextTask(Number(userId))
      res.json({
        nextTask,
        amount
      })

    }else{
      return res.json({
        message:"unable to parse the request body"
      })
    }
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

  //const hardcodedWallet = "0xDf9CC5gdfgfgfd6c43a594B8350E55Ffc50b2b8C515";
  //Authentication logic
  const signature = req.body.signature
  const publicKey = req.body.publickey

  const message = new TextEncoder().encode("Sign in to mechnical Turks");

  const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );

    if(!result){
      return res.status(411).json({
        message:"invalid signature"
      })
    }



  const existingUser = await prismaClient.worker.findFirst({
    where: {
      address: publicKey,
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
        address: publicKey,
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
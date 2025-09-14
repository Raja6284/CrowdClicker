import { Router } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { authMiddleware } from "../middleware/authMiddleware";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { createTaskInput } from "../types";
import { optional } from "zod";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { Connection,Transaction } from "@solana/web3.js";


const router = Router();
const connection = new Connection(process.env.SOLANA_DEVNET_RPC_URL || "")

const JWT_SECRET = process.env.JWT_SECRET ?? "";
//console.log(JWT_SECRET)
const accessKeyId = process.env.AWS_ACCESS_KEY ?? "";
const secretAccessKey = process.env.AWS_SECRET ?? "";
const TOTAL_DECIMAL = Number(process.env.TOTAL_DECIMAL)  ?? 1000000
const PARENT_WALLET_ADDRESS = "FdPedWg8PMvDpi5dcwBZ6o5YY2Buxd1ivdvUpZQXft7P"

//console.log(accessKeyId,secretAccessKey)

const prismaClient = new PrismaClient();

const s3Client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region: "eu-north-1",
});


router.get('/task',authMiddleware,async(req,res)=>{

  //@ts-ignore
  const taskId:string = req.query.taskId
  //@ts-ignore
  const userId:string = req.userId

  const taskDetails = await prismaClient.task.findFirst({
    where:{
      user_id:Number(userId),
      id:Number(taskId)
    },
    include:{
      options:true
    }
  })

  if(!taskDetails){
    return res.json({
      status:403,
      message:"you dont have access to this"
    })
  }

  const response = await prismaClient.submission.findMany({
    where:{
      task_id:Number(taskId)
    },
    include:{
      option:true
    }
  })

  const result:Record<string,{
    count:number,
    option:{
      imageUrl:string
    }
  }> = {}
  

  taskDetails.options.forEach(option=>{
    result[option.id] = {
      count : 0,
      option:{
        imageUrl:option.image_url
      }
    }
  })

  response.forEach(r=>{
    result[r.option_id].count++
  })

  res.json({
    title:taskDetails.title,
    result:result
  })

  
})


router.post('/task',authMiddleware, async(req,res)=>{
  //valiate the input from user, can use zod
  //@ts-ignore
  const userId= req.userId
  const body = req.body

  const parseData = createTaskInput.safeParse(body)

  if(!parseData.success){
    return res.json({
      status:403,
      message:"you have sent the wrong input"
    })
  }

  const user = await prismaClient.user.findFirst({
    where:{
      id:userId
    }
  })
  //parse the signature here to get the amout paid by the user for creating the task

  const transaction = await connection.getTransaction(parseData.data.signature ,{
    maxSupportedTransactionVersion:1
  })

  console.log(transaction)


      if ((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
        return res.status(411).json({
            message: "Transaction sent from wrong address"
        })
    }




  let response = await prismaClient.$transaction(async tx=>{
    //query1
    const task = await tx.task.create({
      data:{
        title:parseData.data.title?? "",
        amount:0.1 * TOTAL_DECIMAL ,//get that from the signature
        signature:parseData.data.signature,
        user_id:userId
      }
    })

    //query2
    const options = await tx.option.createMany({
      data : parseData.data.options.map(x=>({
        image_url : x.imageUrl,
        task_id : task.id
      }))
    })

    // console.log(task)
    // console.log(options)
    return task;
  })

  return res.json({
    id: response.id
  })

})


router.get("/presignedUrl", authMiddleware, async (req, res) => {
  //@ts-ignore
  const userId = req.userId;

  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: "crowdclicker",
    Key: `/folder1/${userId}/${Math.random()}/image.jpg`,
    Conditions: [
      ["content-length-range", 0, 5 * 1024 * 1024], // 5 MB max
    ],
    Fields: {
      "Content-Type": "image/png",
    },
    Expires: 3600,
  });

  //console.log({ url, fields });
  return res.json({
    preSignedUrl:url,
    fields,
  });
});

//signin with wallet
//signing a message
router.post("/signin", async (req, res) => {
  //const hardcodedWallet = "0xDf9CC552C236c43a594B8350E55Ffc50b2b8C515";
  const publicKey = req.body.publicKey
  const signature = req.body.signature
  //Authentication logic

  const message = new TextEncoder().encode("Sign in to mechnical Turks");

  const result = nacl.sign.detached.verify(
    message,
    new Uint8Array(signature.data),
    new PublicKey(publicKey).toBytes()
  )

  if(!result){
    return res.status(411).json({
      message:"invalid signature"
    })
  }



  const existingUser = await prismaClient.user.findFirst({
    where: {
      address: publicKey,
    },
  });

  if (existingUser) {
    const token = jwt.sign(
      {
        userId: existingUser.id,
      },
      JWT_SECRET
    );

    return res.json({
      token,
    });
  } else {
    const user = await prismaClient.user.create({
      data: {
        address: publicKey,

      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );

    return res.json({
      token,
    });
  }
});

//presignedUrl

export default router;

import { PrismaClient } from "@prisma/client"

const prismaClient = new PrismaClient()

export async function getNextTask(userId:number){
    

    const nextTask = await prismaClient.task.findMany({
        where:{
            done:false,
           submissions:{
            none:{
                worker_id:userId,
            }
           }
        },
        select:{
            id:true,
            options:true,
            title:true
        }
    })

    return nextTask
}
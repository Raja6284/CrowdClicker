import express from 'express'
import userRouter from './routers/user'
import workerRouter from './routers/worker'
import cors from 'cors'


const app = express()
app.use(cors())
app.use(express.json())


app.use('/api/v1/user',userRouter)
app.use('/api/v1/worker',workerRouter)



const PORT = 3000
app.listen(PORT,()=>{
    console.log(`server is running on address http://localhost:${PORT}`)
})
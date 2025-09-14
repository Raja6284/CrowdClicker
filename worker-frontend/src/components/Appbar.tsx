
"use clent";
import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import axios from 'axios';



const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""


export default function Appbar(){

    const {publicKey,signMessage} = useWallet();

    console.log(publicKey)

    async function signAndSend(){

         if(!publicKey){
            return;
         }

         try{

            const message = new TextEncoder().encode("Sign in to mechnical Turks");
            const signature = await signMessage?.(message)

            // console.log("this is signature " , signature);
            // console.log("this is Public key " + publicKey)

            const response = await axios.post(`${BACKEND_URL}/v1/user/signin`,{
                signature,
                publicKey:publicKey.toString()
            })

            //console.log(response)

            localStorage.setItem("token",response.data.token)

         }catch(e){
            console.log(e);
         }
    }

    useEffect(()=>{
        signAndSend()
    },[publicKey])


    return(
        <div className="flex justify-between border-b pb-2 pt-2 bg-white">
        <div className="text-2xl pl-4 flex justify-center pt-3 text-black font-bold">
            CrowdClicker-WorkerSide
        </div>
        <div className="text-xl pr-4 pb-2">
            {publicKey  ? <WalletDisconnectButton /> : <WalletMultiButton />}
        </div>
    </div>
    )
}
import {
  Wallet,
  hexlify,
  toUtf8Bytes,
  AbiCoder,
  keccak256,
  JsonRpcProvider,
} from "ethers";
import dotenv from "dotenv";
import { BlockData } from "@stackr/sdk";
import { encodeAbiParameters } from 'viem';

dotenv.config();

// export const sendBlock = async(blockData: BlockData) => {
//     console.log("Executing task");
//     const taskDefinitionId = 0;
//     const data = encodeAbiParameters({
       
//     });
// }

export const sendTask = async (
  proofOfTask: string,
  data: string,
  taskDefinitionId: number
) => {
  var wallet = new Wallet(process.env.PRIVATE_KEY as string);
  var performerAddress = wallet.address;

  data = hexlify(toUtf8Bytes(data));
  const message = AbiCoder.defaultAbiCoder().encode(
    ["string", "bytes", "address", "uint16"],
    [proofOfTask, data, performerAddress, taskDefinitionId]
  );
  const messageHash = keccak256(message);
  console.log("Message hash:", messageHash);
  const sig = wallet.signingKey.sign(messageHash).serialized;

  const jsonRpcBody = {
    jsonrpc: "2.0",
    method: "sendTask",
    params: [proofOfTask, data, taskDefinitionId, performerAddress, sig],
  };
  try {
    const provider = new JsonRpcProvider(process.env.OTHENTIC_CLIENT_RPC_ADDRESS);
    const response = await provider.send(
      jsonRpcBody.method,
      jsonRpcBody.params
    );
    console.log("API response:", response);
  } catch (error) {
    console.error("Error making API request:", error);
  }
};
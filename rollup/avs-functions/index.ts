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
import { blockType } from "./types";
import pinataSDK from "@pinata/sdk";

dotenv.config();

export const sendBlock = async (blockData: BlockData) => {
  const operator = new Wallet(process.env.PRIVATE_KEY as string);
  const { operatorSignature } = blockData;
  const vulcanLeaderSignature = await operator.signMessage(
    operatorSignature.toString()
  );
  console.log("Executing task");
  const taskDefinitionId = 0;
  const values = [
    blockData.hash,
    blockData.parentHash,
    blockData.actionRoot,
    blockData.acknowledgementRoot,
    blockData.stateRoot,
    blockData.height,
    blockData.timestamp,
    blockData.appId,
    blockData.builderSignature as `0x${string}`,
    vulcanLeaderSignature,
    blockData.operatorSignature as `0x${string}`,
  ];

  const data = AbiCoder.defaultAbiCoder().encode(blockType, values);

  const proofOfTask = await publishJSONToIpfs(blockData);
  if (proofOfTask == undefined) {
    throw new Error("Error publishing to IPFS");
  }

  await sendTask(proofOfTask, data, taskDefinitionId);
};

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
    const provider = new JsonRpcProvider(
      process.env.OTHENTIC_CLIENT_RPC_ADDRESS
    );
    const response = await provider.send(
      jsonRpcBody.method,
      jsonRpcBody.params
    );
    console.log("API response:", response);
  } catch (error) {
    console.error("Error making API request:", error);
  }
};

export const publishJSONToIpfs = async (data: BlockData) => {
  var proofOfTask = "";
  try {
    const pinata = new pinataSDK(
      process.env.PINATAENVKEY,
      process.env.PINATASECRETAPIKEY
    );
    const response = await pinata.pinJSONToIPFS(data);
    proofOfTask = response.IpfsHash;
    console.log(`proofOfTask: ${proofOfTask}`);
    return proofOfTask;
  } catch (error) {
    console.error("Error making API request to pinataSDK:", error);
  }
};

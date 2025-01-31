import { Wallet, AbiCoder, keccak256, JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
import { BlockData } from "@stackr/sdk";
import { blockType } from "./types";
import pinataSDK from "@pinata/sdk";
import sqlite3 from "sqlite3";
import { submitBlob } from "../DA/utils";

dotenv.config();

export type proofDataType = {
  block: BlockData;
  rawState: string;
};

export const sendBlock = async (blockData: BlockData) => {
  console.log("creating vulcan leader signature");
  const operator = new Wallet(process.env.PRIVATE_KEY as string);
  const { operatorSignature } = blockData;
  const vulcanLeaderSignature = await operator.signMessage(
    operatorSignature.toString()
  );
  console.log("vulcan leader signature created");
  console.log("building proof of task data");
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

  const rawState = await fetchRawState(blockData.hash);
  if (rawState == null) {
    throw new Error("Error fetching raw state");
  }
  const proofOfTaskData: proofDataType = {
    block: blockData,
    rawState: rawState,
  };
  console.log("proofOfTask data :", proofOfTaskData);
  try {
    // const proofOfTask = await publishJSONToIpfs(proofOfTaskData);
    const availPostData = await submitBlob(proofOfTaskData);
    const proofOfTask = `${availPostData.blockHash}:${availPostData.txHash}`;
    console.log("Proof of task Data published to DA: ", proofOfTask);
    if (proofOfTask == undefined) {
      throw new Error("Error publishing to IPFS");
    }
    // await sendTask(proofOfTask, data, taskDefinitionId);
  } catch (e) {
    console.log(e);
  }
};

export const sendTask = async (
  proofOfTask: string,
  data: string,
  taskDefinitionId: number
) => {
  console.log("Sending task");
  var wallet = new Wallet(process.env.PRIVATE_KEY as string);
  var performerAddress = wallet.address;

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
    console.log("Task sent successfully");
  } catch (error) {
    console.error("Error making API request:", error);
  }
};

export const publishJSONToIpfs = async (data: proofDataType) => {
  var proofOfTask = "";
  try {
    const pinata = new pinataSDK(
      process.env.PINATA_API_KEY,
      process.env.PINATA_SECRET_API_KEY
    );

    const response = await pinata.pinJSONToIPFS(data);
    proofOfTask = response.IpfsHash;
    return proofOfTask;
  } catch (error) {
    console.error("Error making API request to pinataSDK:", error);
  }
};

export const fetchRawState = async (
  blockHash: string
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(`${process.env.DATABASE_URI}`, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        return reject(err);
      }
    });

    const query = `
      SELECT block_state_updates.previousState 
      FROM block_state_updates
      INNER JOIN blocks ON blocks.hash = block_state_updates.blockHash
      WHERE blocks.hash = ?
    `;

    db.all(query, [blockHash], (err, rows: any) => {
      if (err) {
        console.error("Error fetching data:", err.message);
        db.close();
        return reject(err);
      }

      let rawState: string | null = null;

      if (rows.length > 0) {
        rawState = rows[0].previousState;
      } else {
        console.log("No matching records found.");
      }

      db.close((err) => {
        if (err) {
          console.error("Error closing database:", err.message);
          return reject(err);
        }
        resolve(rawState);
      });
    });
  });
};

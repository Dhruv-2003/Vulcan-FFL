import {
  Wallet,
  hexlify,
  toUtf8Bytes,
  AbiCoder,
  keccak256,
  JsonRpcProvider,
} from "ethers";

export const verifyTask = async (
  proofOfTask: string,
  data: string,
  taskDefinitionId: number
) => {
  var wallet = new Wallet(process.env.PRIVATE_KEY as string);
  var performerAddress = wallet.address;

  //   data = hexlify(toUtf8Bytes(data));
  const message = AbiCoder.defaultAbiCoder().encode(
    ["string", "bytes", "address", "uint16"],
    [proofOfTask, data, performerAddress, taskDefinitionId]
  );
  const messageHash = keccak256(message);
  console.log("Message hash:", messageHash);

  // POST REST call to the API localhost:4002/task/validate with the body as data , proofOfTask , taskDefinitionId & performer
  console.log({
    data,
    proofOfTask,
    taskDefinitionId,
    performer: performerAddress,
  });
  try {
    const response = await fetch("http://localhost:4002/task/validate", {
      method: "POST",
      body: JSON.stringify({
        data,
        proofOfTask,
        taskDefinitionId,
        performer: performerAddress,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("API response:", response);
  } catch (error) {
    console.error("Error making API request:", error);
  }
};

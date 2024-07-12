import { extractData } from "../DA/utils";
import { H256 } from "@polkadot/types/interfaces/runtime";

async function query() {
  const proofOfTask =
    "0xa84aec8663ccf920eac5817608684756e936817debd247cc470d7110b4ed9bc6:0x91d832b3fd9683efc126481d12f04459b77d326005b921b148e3267486325c2a";

  const proofArr = proofOfTask.split(":");
  const blockHash = proofArr[0] as any;
  const txHash = proofArr[1] as any;

  console.log(blockHash, txHash);
  const data = await extractData(blockHash as string, txHash as string);
  console.log(data);
}

query();

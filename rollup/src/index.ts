import express, { Request, Response } from "express";
import { sendBlock } from "../avs-functions/index.ts";
import { BlockEvents } from "@stackr/sdk";
import { Playground } from "@stackr/sdk/plugins";
import dotenv from "dotenv";
import { schemas } from "./actions.ts";
import { ERC20Machine, mru } from "./erc20.ts";
import { transitions } from "./transitions.ts";

console.log("Starting server...");
dotenv.config({ path: "../.env" });


const erc20Machine = mru.stateMachines.get<ERC20Machine>("erc-20");

const app = express();
app.use(express.json());

console.log(process.env);

if (process.env.NODE_ENV === "development") {
  console.log("Starting playground...");
  const playground = Playground.init(mru);

  playground.addGetMethod(
    "/custom/hello",
    async (_req: Request, res: Response) => {
      res.json({
        message: "Hello from the custom route",
      });
    }
  );
}

const { actions, chain, events } = mru;

let isSubscribed = false;

if (!isSubscribed) {
  console.log(isSubscribed);
  let inProgress = false;
  events.subscribe(BlockEvents.SUBMITTED, async (args) => {
    const { block } = args;
    if (inProgress) {
      return;
    }
    inProgress = true;
    console.log("Submitted a block to Vulcan");
    console.log("Block details : ", block);
    await sendBlock(block);
    inProgress = false;
  });
  isSubscribed = true;
}

app.get("/actions/:hash", async (req: Request, res: Response) => {
  const { hash } = req.params;
  const action = await actions.getByHash(hash);
  if (!action) {
    return res.status(404).send({ message: "Action not found" });
  }
  return res.send(action);
});

app.get("/blocks/:hash", async (req: Request, res: Response) => {
  const { hash } = req.params;
  const block = await chain.getBlockByHash(hash);
  if (!block) {
    return res.status(404).send({ message: "Block not found" });
  }
  return res.send(block);
});

app.post("/:reducerName", async (req: Request, res: Response) => {
  const { reducerName } = req.params;
  const actionReducer = transitions[reducerName];

  if (!actionReducer) {
    res.status(400).send({ message: "̦̦no reducer for action" });
    return;
  }
  const action = reducerName as keyof typeof schemas;

  const { msgSender, signature, inputs } = req.body;

  const schema = schemas[action];

  try {
    const newAction = schema.actionFrom({ msgSender, signature, inputs });
    const ack = await mru.submitAction(reducerName, newAction);
    res.status(201).send({ ack });
  } catch (e: any) {
    res.status(400).send({ error: e.message });
  }
  return;
});

app.get("/", (_req: Request, res: Response) => {
  return res.send({ state: erc20Machine?.state });
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});

//////// AVS Block Syncer ///////////

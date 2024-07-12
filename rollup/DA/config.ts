import dotenv from "dotenv";
dotenv.config();

export const config = {
  mnemonic: process.env.MNEMONIC, // The secret seed value for account used to sign transactions
  ApiURL: process.env.APIURL, // Api url
  app_id: 64, // Application id
  amount: 1, // Amount of tokens to transfer
  receiver: "5CcUi3VF3Uq1zKqBRqASKPTNEc2rejNFeWqha19DYvUKY6ip", // Receiver address
  endpoint: process.env.ENDPOINT, // Endpoint
  seed: process.env.SEED, // Seed
};

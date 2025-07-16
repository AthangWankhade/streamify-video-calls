import "dotenv/config";
import { StreamChat } from "stream-chat";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_KEY_SECRET;

if (!apiKey || !apiSecret) {
  console.log("Stream API key or secret is missing");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (UserData) => {
  try {
    await streamClient.upsertUsers([UserData]);
    return UserData;
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
};

export const generateStreamToken = (userId) => {
  try {
    //ensure userID is a string
    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.log("Error generating Stream Token:", error);
  }
};

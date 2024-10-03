import { AzureChatOpenAI } from "@langchain/openai";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { getImageUrlsTool, uploadImagesTool } from "@/lib/aiTools";
import { DynamoDBChatMessageHistory } from "@langchain/community/stores/message/dynamodb";
import { updateLastMessagesAdditionalKwargs } from "@/lib/updateLastMessagesAdditionalKwargs";
import { toolMap } from "@/lib/toolMap";

export async function POST(req: Request) {
  try {
    const { spreadsheetUrl, sheetName, columnName, userPrompt } =
      await req.json();

    if (!spreadsheetUrl || !sheetName || !columnName || !userPrompt) {
      return Response.json(
        {
          error:
            "Missing required parameters: spreadsheetUrl, sheetName, columnName or userPrompt",
        },
        { status: 400 }
      );
    }

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an AI automation expert. Call all the appropriate functions to perform all the tasks as instructed by the user. Use the tools provided to you to perform all the said tasks. Make sure to call all the required tools/functions to fully complete all the instructed tasks. Even if you don't have all the required inputs always call all the necessary tools/functions and let the user know that required inputs were missing.`,
      ],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    const llm = new AzureChatOpenAI({
      model: "gpt-4o-mini",
    }).bindTools([uploadImagesTool, getImageUrlsTool]);

    const chain = prompt.pipe(llm);

    const runnableWithChatHistory = new RunnableWithMessageHistory({
      runnable: chain,
      inputMessagesKey: "input",
      historyMessagesKey: "chat_history",
      getMessageHistory: async (sessionId) => {
        return new DynamoDBChatMessageHistory({
          tableName: process.env.AWS_DYNAMO_DB_TABLE_NAME!,
          partitionKey: process.env.AWS_DYNAMO_DB_TABLE_PARTITION_KEY,
          sessionId,
          config: {
            region: process.env.AWS_REGION,
            credentials: {
              accessKeyId: process.env.AWS_DYNAMO_DB_ACCESS_KEY_ID!,
              secretAccessKey: process.env.AWS_DYNAMO_DB_SECRET_ACCESS_KEY!,
            },
          },
        });
      },
    });

    const userInput = `
    userPrompt: ${userPrompt}

    spreadsheetUrl: ${spreadsheetUrl}

    sheetName: ${sheetName}

    columnName: ${columnName}
    `;

    const res = await runnableWithChatHistory.invoke(
      { input: userInput },
      { configurable: { sessionId: process.env.SESSION_ID } }
    );

    if (!res) {
      return Response.json(
        {
          error: "Couldn't generate AI response. Please try again",
        },
        { status: 502 }
      );
    }

    if (res.tool_calls?.length === 0) {
      console.log(res.content);
    } else {
      console.log(
        await updateLastMessagesAdditionalKwargs(process.env.SESSION_ID!)
      );
      console.log("RESPONSE", res);
      let previousToolOutput: any = null;

      for (const toolCall of res.tool_calls!) {
        const selectedTool = toolMap[toolCall.name as keyof typeof toolMap];

        // If there is a previous output, modify `toolCall.args` based on the previous tool's output.
        if (previousToolOutput && toolCall.name === "Upload-Images-Tool") {
          // Parse `previousToolOutput` to extract `imageLinksArray`.
          const previousOutputContent = JSON.parse(previousToolOutput.content);
          toolCall.args.imageUrlsArray =
            previousOutputContent.imageLinksArray || [];
        }

        // Invoke the tool with the modified `toolCall` object.
        const toolMessage = await selectedTool.invoke(toolCall);
        console.log(toolMessage);

        // Update the previousToolOutput with the current tool's output.
        previousToolOutput = toolMessage;
      }
    }

    return Response.json(
      {
        success: "Images uploaded successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERROR", error);
    return Response.json(
      {
        error: "An unexpected error occurred. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

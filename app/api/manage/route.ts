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

    // console.log("BODY", {
    //   spreadsheetUrl: spreadsheetUrl.trim(),
    //   sheetName: sheetName.trim(),
    //   columnName: columnName.trim(),
    //   userPrompt: userPrompt.trim(),
    // });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an AI automation expert. Think carefully in a STEP BY STEP MANNER to break down the userPrompt into individual instructions and decide what tools/functions to call. Always call all the appropriate functions to perform all the tasks as instructed by the user. Use the tools provided to you to perform all the said tasks. Always make sure to call all the required tools/functions to fully complete all the instructed tasks. Even if you don't have all the required inputs always call all the necessary tools/functions and let the user know that required inputs were missing.`,
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

    let message;
    let toolMessage;

    if (res.tool_calls?.length === 0) {
      message = res.content;
      console.log(message);
    } else {
      console.log(
        await updateLastMessagesAdditionalKwargs(process.env.SESSION_ID!)
      );
      console.log("TOOL CALLS", res.tool_calls);

      for (const toolCall of res.tool_calls!) {
        const selectedTool = toolMap[toolCall.name as keyof typeof toolMap];

        if (toolMessage) {
          const previousOutputContent = JSON.parse(toolMessage.content);

          for (const key in toolCall.args) {
            if (previousOutputContent[key] !== undefined) {
              toolCall.args[key] = previousOutputContent[key];
            }
          }
        }

        //console.log("TOOL CALL ARGS", toolCall.args);

        toolMessage = await selectedTool.invoke(toolCall);

        const toolMessageContent = JSON.parse(toolMessage.content);
        message = toolMessageContent.success
          ? toolMessageContent.success
          : toolMessageContent.error;
        console.log("toolMessageContent", message);
      }
    }

    return Response.json(
      {
        success: message,
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

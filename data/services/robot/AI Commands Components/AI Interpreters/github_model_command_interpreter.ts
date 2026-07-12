import OpenAI from "openai";
import { RobotCommandStandardResponse } from "../robot_command_standard_response";
import { AICommandInterpreter } from "./ai_command_interpreter";

export class GithubModelCommandInterpreter implements AICommandInterpreter {
    async interpret(prompt: string): Promise<unknown> {

        const token = process.env.GITHUB_MODEL_API_KEY;
        const endpoint = "https://models.github.ai/inference";
        const model = "openai/gpt-4.1-mini";

        const client = new OpenAI({ baseURL: endpoint, apiKey: token });

        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: ""
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
        });

        const response = completion.choices[0].message?.content;
        
        if (!response) {
            throw new Error("No response from the model");
        }

        try{
             return JSON.parse(response);
        }catch{
            throw new Error("The response wasnt a JSON");
        }
    }
}
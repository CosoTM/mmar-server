import { JointAngle } from "../../../../../mmar-global-data-structure/models/robot/Robot Data Objects/joints_angle";
import { RobotType } from "../../../../../mmar-global-data-structure/models/robot/Robot_type";
import { RobotBaseResolver } from "../Command Resolvers/Robot_base_resolver";
import { RobotCommandDefinition } from "../Robot Command Definition/robot_command_definiton";
import { RobotCommandResponse, RobotCommandStandardResponse, RobotNoUnderstandingResponse } from "./robot_command_standard_response";

class AIStandardResponseValidator {
    validateGeneralFormat(
        response: unknown
    ): RobotCommandStandardResponse {

        if (typeof response !== "object" || response === null) throw new Error("Response must be an object");

        const typedResponse = response as {
            status?: unknown;
            operation?: unknown;
            parameters?: unknown;
            message?: unknown;
        };

        if (typeof typedResponse.status !== "string") 
            throw new Error("Missing or invalid status field");

        if (typedResponse.status === "no_understanding") {
            if (typeof typedResponse.message !== "string") 
                throw new Error("Missing or invalid message field on no_understanding response");
            return response as RobotNoUnderstandingResponse
        }

        if (typedResponse.status === "command") {
            if (typeof typedResponse.operation !== "string")
                throw new Error("Missing or invalid operation field on command response");

            if (
                typeof typedResponse.parameters !== "object" ||
                typedResponse.parameters === null ||
                Array.isArray(typedResponse.parameters)
            ) throw new Error("Missing or invalid parameters field");

            return response as RobotCommandResponse;
        }

        throw new Error("Unsupported response status.")
    }

    checkResponseStatus(
        response: RobotCommandStandardResponse
    ) {
        if (response.status === "no_understanding")
            throw new Error("Couldnt create a valid response due to misunderstanding. Reason: \n" + response.message)

        return response as RobotCommandResponse
    }

    isCommandSupported(
        standardResponse: RobotCommandResponse,
        supportedCommands: RobotCommandDefinition[]
    ) {
        if (standardResponse.operation === "" || standardResponse.operation === null) return false
        if (standardResponse.operation === "no_operation") return false
        const supportedCommandsString: string[] = supportedCommands.map(o => o.commandName);
        return supportedCommandsString.includes(standardResponse.operation)
    }

    validateMoveJointsCommand(
        resolver: RobotBaseResolver<RobotType>,
        standardResponse: RobotCommandResponse
    ): JointAngle {
        if (standardResponse.operation !== "moveJoints") throw Error("");
        if (!standardResponse.parameters) throw new Error("Invalid joints parameter");
        const joints = standardResponse.parameters["joints"]

        if (!Array.isArray(joints) || !joints.every(v => typeof v === "number")) throw new Error("Invalid joints parameter");
        if (joints.length !== resolver.jointNumber) throw new Error("Invalid joints parameter");

        const jointAngles = new JointAngle()
        jointAngles.joints = joints

        return jointAngles
    }
}

export default new AIStandardResponseValidator()
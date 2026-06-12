import { JointAngle } from "../../../../../mmar-global-data-structure/models/robot/Robot Data Objects/joints_angle";
import { RobotType } from "../../../../../mmar-global-data-structure/models/robot/Robot_type";
import { MotionsSettings} from "../../../../../mmar-global-data-structure/models/robot/robot_settings";
import { RobotCommandDefinition } from "../Robot Command Definition/robot_command_definiton";


/**
 * @classdesc This is the Base Class for all Robot Resolvers. It defines the common methods and properties that every Robot Resolver must implement.
 * @template T - All resolvers must specify the Robot Type that they can handle.
 */
export abstract class RobotBaseResolver<T extends RobotType>{
    /**
     * Identifies the Type of Robot the Resolver handles.
     */
    public abstract readonly forType:T

    /**
     * Number of joints the Robot Arm has.
     */
    public abstract readonly jointNumber:number

    /**
     * @description - Common method that returns the command to move a Robot Arm to a specified Point.
     * @param x The x Position Component
     * @param y The y Position Component
     * @param z The z Position Component
     * @param rx The x Rotational Component
     * @param ry The y Rotational Component
     * @param rz The z Rotational Component
     * @returns The Command String to move the specific Robot Arm.
     */
    abstract moveToPoint(x:number,y:number,z:number,rx:number,ry:number,rz:number, settings?: Partial<MotionsSettings>):string

    /**
     * @description - Common method that returns the command to move the joins of a Robot Arm.
     * @param angles Angle of every joint of the Robot Arm.
     * @returns The Command String to move the joints of a specific Robot Arm.
     */
    abstract moveJoints(angles:JointAngle, settings?: Partial<MotionsSettings>):string

    /**
     * @description - Common method that returns the command to get the position of every joint of a Robot Arm.
     * @returns The Command String to return the position of every joint of a specific Robot Arm.
     */
    abstract getJointPose():string

    /**
     * @description - Method used to parse the response of a Robot Arm to a command.
     * @param data The data that the Robot Arm sent back as a response to a command.
     * @returns The data parsed in the format of the specific Robot Arm.
     */
    abstract parseReply(data:string):any

    /**
     * @description - Method used to parse feedback/status data sent by a Robot Arm. 
     * @param data  The data that the Robot Arm sent back as feedback/status information.
     * @returns The data parsed in the format of the specific Robot Arm.
     */
    abstract parseFeedbackData(data:string):any
    
    abstract getSupportedCommands():RobotCommandDefinition[]
}

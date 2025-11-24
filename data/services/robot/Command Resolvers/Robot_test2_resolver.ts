import { JointAngle } from "../../../../../mmar-global-data-structure/models/robot/Robot Data Objects/joints_angle";
import { RobotType } from "../../../../../mmar-global-data-structure/models/robot/Robot_type";
import { RobotBaseResolver } from "./Robot_base_resolver";

export class RobotTest2Resolver extends RobotBaseResolver<typeof RobotType.TEST_ROBOT2>{
    public readonly jointNumber: number = 4;
    public readonly forType = RobotType.TEST_ROBOT2;

    moveToPoint(x: number, y: number, z: number, rx: number, ry: number, rz: number): string {
        throw new Error("Method not implemented.");
    }

    moveJoints(angles:JointAngle): string {
        return `Move(joints={${angles.joints.join(',')}})`
    }

    getJointPose(): string {
        return "GetJointPose()"
    }

    parseReply(data:string) {
        return JSON.parse(data)
    }

    parseFeedbackData(data: string) {
        throw new Error("Method not implemented.");
    }
}

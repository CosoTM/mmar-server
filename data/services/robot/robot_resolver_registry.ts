import { RobotBaseResolver } from "./Command Resolvers/Robot_base_resolver";
import { RobotType } from "../../../../mmar-global-data-structure/models/robot/Robot_type";
import {
    HTTP500Error,
    BaseError
} from "../middleware/error_handling/standard_errors.middleware";

/**
 * @classdesc This class is used to register a series of RobotResolvers according to the Robot Type they work with.
 */
export class RobotResolverRegistry {
    // A map containing for each RobotType, its corresponding Resolver.
    private readonly resolverMap: Map<RobotType, RobotBaseResolver<RobotType>>;

    constructor(resolvers:RobotBaseResolver<RobotType>[] = []) {
        // For each element on the given array of resolvers, we return a tuple
        // containing the RobotType handled by the resolver, and the resolver itself 
        this.resolverMap = new Map(resolvers.map(rs => [rs.forType, rs]));
    }

    /**
     * @description Given a Robot Type, returns the corresponding Resolver. If no Resolver is found, returns an error.
     * @param {RobotType} robot_type - A Robot Type 
     * @returns The corresponsing Resolver for the given Robot Type, or an error if no Resolver is found.
     */
    getResolver(robot_type:RobotType): RobotBaseResolver<RobotType>|BaseError{
        const rs = this.resolverMap.get(robot_type)
        if (!rs) return new HTTP500Error(`No Resolver found for the specified Robot Type. Are you sure the Robot type '${robot_type}' exists?`);
        return rs;
    }
}
import { RequestHandler } from "express";
import { Robot } from "../../../../../mmar-global-data-structure";
import { isRobotType, RobotType } from "../../../../../mmar-global-data-structure/models/robot/Robot_type";

export const verif_robot_body: RequestHandler = async (req, res, next) => {
    const newRobotData = Robot.fromJS(req.body) as Robot

    // If the IP address (IPv4) format is invalid, return an error and stop the request.
    if(!/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/.test(newRobotData.get_ipAddress()))
        res.status(400).send("Invalid IP Address format.")
    
    // If the Robot Type that is tried to be assigned doesnt exist, return an error and stop the request.
    if(!isRobotType(newRobotData.get_robotType())) 
        res.status(404).send("Robot Type not Found. These are the available Robot Types: " + Object.values(RobotType))

    next()
};
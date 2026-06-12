import { Router } from "express";
import { authenticate_token } from "../data/services/middleware/auth.middleware";
import Metamodel_Robot_controller from "../controllers/meta/Metamodel_robot.controller";
import Robot_socketController from "../controllers/Robot_socket.controller";
import { verif_robot_body } from "../data/services/rule_engine/meta_rule_engine/Metamodel_robot_rules";

const robotRouter = Router();

robotRouter.get("/", function (req, res) {
  res.send("Robot route is working");
});

// Manage Endpoints
robotRouter.post(
  "/define/:uuid", 
  authenticate_token,
  verif_robot_body,
  Metamodel_Robot_controller.post_define_robot
);

robotRouter.delete(
  "/delete/:uuid", 
  authenticate_token,
  Metamodel_Robot_controller.delete_robot_by_uuid
);

// Operation Endpoints
robotRouter.post(
  "/connect/:uuid", 
  authenticate_token,
  Robot_socketController.connect_robot_by_uuid
);

robotRouter.get(
  "/get_joints/:uuid",
  authenticate_token,
  Robot_socketController.get_robot_joints_by_uuid
);

robotRouter.post(
  "/move_joints/:uuid",
  authenticate_token,
  Robot_socketController.move_robot_joints_by_uuid
);

robotRouter.put(
  "/ai_command/:uuid",
  authenticate_token,
  Robot_socketController.execute_prompt
);

export default robotRouter;
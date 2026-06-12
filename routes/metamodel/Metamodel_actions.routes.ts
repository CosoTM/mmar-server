import { Router } from "express";

const actionRouter:Router = Router();

actionRouter.get("/actions/test", function(_, res){
    res.send("Action route is working")
})

export default actionRouter 
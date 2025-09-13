import { Request, Response } from "express";
import { UserService } from "../services/UserService";

export class UserController {
  private service = new UserService();

  health = (req: Request, res: Response) => {
    return res.status(200).json(true);
  }

  createUser = async (req: Request, res: Response) => {
    const user = await this.service.create(req.body);
    res.status(201).json(user);
  };
}

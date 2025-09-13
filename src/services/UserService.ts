import { UserPublisher } from "../publishers/UserPublisher";

export class UserService {
  async create(data: any) {
    const user = { id: Date.now(), ...data };

    // publica evento de forma desacoplada
    await UserPublisher.userCreated(user);

    return user;
  }
}

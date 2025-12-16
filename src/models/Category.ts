export class Category {
  constructor(
    public Name: string,
    public UserId: string,
    public Id?: number
  ) {}
}

export type CategoryWithId = Category & { Id: number };

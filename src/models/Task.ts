export class Task {
  constructor(
    public Description: string,
    public UserId: string,
    public ExpiredAt: string,
    public CategoryId: number,
    public Id?: number
  ) {}
}

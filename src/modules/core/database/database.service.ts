import { PrismaClient } from '@prisma/client';

export class DatabaseService {
  private static instance: PrismaClient | null = null;

  public static getInstance(): PrismaClient {
    DatabaseService.instance ??= new PrismaClient();
    return DatabaseService.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
      DatabaseService.instance = null;
    }
  }
}

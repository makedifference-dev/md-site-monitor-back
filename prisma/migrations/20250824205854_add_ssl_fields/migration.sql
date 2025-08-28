-- AlterTable
ALTER TABLE "public"."site_checks" ADD COLUMN     "sslExpiry" TIMESTAMP(3),
ADD COLUMN     "sslIssuer" TEXT,
ADD COLUMN     "sslValid" BOOLEAN;

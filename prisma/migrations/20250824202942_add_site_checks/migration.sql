-- CreateEnum
CREATE TYPE "public"."CheckStatus" AS ENUM ('SUCCESS', 'ERROR', 'TIMEOUT');

-- CreateTable
CREATE TABLE "public"."site_checks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "public"."CheckStatus" NOT NULL,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "error" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_checks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."site_checks" ADD CONSTRAINT "site_checks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

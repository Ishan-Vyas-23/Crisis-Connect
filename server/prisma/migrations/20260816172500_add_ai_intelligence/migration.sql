-- CreateEnum
CREATE TYPE "ClassificationSource" AS ENUM ('DEFAULT', 'AI', 'HUMAN');

-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "aiClassification",
DROP COLUMN "aiConfidence",
ADD COLUMN     "aiNeedsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "classificationSource" "ClassificationSource" NOT NULL DEFAULT 'DEFAULT';

-- CreateTable
CREATE TABLE "IncidentAIAnalysis" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "suggestedCategory" "IncidentCategory",
    "suggestedPriority" "IncidentPriority",
    "suggestedPeopleAtRisk" BOOLEAN,
    "suggestedSkills" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentAIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncidentAIAnalysis_incidentId_idx" ON "IncidentAIAnalysis"("incidentId");

-- AddForeignKey
ALTER TABLE "IncidentAIAnalysis" ADD CONSTRAINT "IncidentAIAnalysis_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

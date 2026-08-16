-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "IncidentAssignment" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "IncidentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncidentAssignment_incidentId_idx" ON "IncidentAssignment"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentAssignment_volunteerId_idx" ON "IncidentAssignment"("volunteerId");

-- CreateIndex
CREATE INDEX "IncidentAssignment_status_idx" ON "IncidentAssignment"("status");

-- CreateIndex: PostgreSQL Partial Unique Index
CREATE UNIQUE INDEX "unique_active_assignment" ON "IncidentAssignment" ("incidentId", "volunteerId") WHERE "status" IN ('PENDING', 'ACCEPTED', 'ACTIVE');

-- AddForeignKey
ALTER TABLE "IncidentAssignment" ADD CONSTRAINT "IncidentAssignment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentAssignment" ADD CONSTRAINT "IncidentAssignment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "Volunteer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
